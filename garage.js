var Gpio = require('onoff').Gpio;
var config = require('./config');
var configmail = require('./config.mail');
var state = config.states;
var otherSensorTriggered = false;
var garageCurrentState = state.UNKNOWN; 

var childproc = require('child_process');
var dateForm = require('dateformat');
var photonum = 0;

function takePicture() {
  var now = new Date();
  now = dateForm(now, "isoDateTime");
  var filename = 'photo/image_'+photonum+'_'+now+'.jpg';
  var args = ['-w', '320', '-h', '240', '-o', filename, '-t', '1'];
  // option with -t (in ms) important as otherwise default is 5s. vf,hf used to flip image if camera is upside down.
  var spawn = childproc.spawn('raspistill', args);
    
  spawn.on('exit', function(code) {
    console.log('Saved photo: ' + filename + ', Exit code: ' + code);
    photonum++;
  });
  return filename;
}

var nodemailer = require('nodemailer');
var transporter_url = 'smtps://'+configmail.smtp.user+':'+configmail.smtp.pass+'@'+configmail.smtp.url;
var transporter = nodemailer.createTransport(transporter_url);

function sendingMail(subj, picpath) {
  var mailOptions = {
    from: configmail.smtp.from, 
    to: configmail.smtp.to, 
    subject: subj, 
    text: 'Status Update from Garage JS', 
    html: '<b>Status Update from Garage JS</b>',
    attachments: [
      {
        path: picpath,
        encoding: 'base64'
      }
    ] 
  };

  transporter.sendMail(mailOptions, function(error, info){
    if(error){
        return console.log(error);
    }
    console.log('Message sent: ' + info.response + ' with filename: ' + picpath);
  });
}

// Setup Motor
var doormotor;
(function setMotor() {
  if (config.motor) {
    doormotor = new Gpio(config.motor.pin, config.motor.status);
    console.log("Setup Motor with GPIO Pin: ", config.motor.pin);

    if (config.camera.enable) {
      var file = takePicture();
      sendingMail("1L: Garage Setup and Ready", file);
    }

  }
}());

// Setup Sensors
var doorsensor = [];
(function setSensors() {
  if (config.sensors) {
    var i = 0;
    Object.keys(config.sensors).forEach(function (sensor) {
      var sens = config.sensors[sensor];
      doorsensor[i] = new Gpio(sens.pin, sens.type, sens.edge, {debounceTimeout: sens.debounce});
      doorsensor[i].watch(function (err, value) {
    	if (err) {
    	  throw err;
  	}

        // when false, indicates a "falling" edge, which in turn indicates a magnet passing and a genuine event
  	if (value == false) {
    	  console.log("Triggered Sensor ", sensor);

	  if (otherSensorTriggered == true) {

 	    // if Top sensor (0) triggered and Other previous, then must be Closed
      	    garageCurrentState = (sensor === "topsensor") ? state.OPEN : state.CLOSED; 
            otherSensorTriggered = false;
      	    console.log("Garage current state is ", garageCurrentState.desc);
	    
	    if (config.camera.enable) {
	      var file = takePicture();
              sendingMail("1L: Garage is now " + garageCurrentState.desc, file);
            }	
    	  } else {

            // if top sensor (0) then Closing, if bottom (1) then Opening; By knowing which sensor is triggered first we can recover from unknown state
	    garageCurrentState = (sensor === "topsensor") ? state.CLOSING : state.OPENING; 
      	    otherSensorTriggered = true;
      	    console.log("Garage changing state is ", garageCurrentState.desc);
    	  }
  	}
      });

      i += 1;
    });
  }
}());

// Control the Door Motor
function movedoor() {
  console.log("Moving the door..");

  setTimeout(function() {
    doormotor.write(1); // After a 2 second pause, reset the pin to 1/High, allowing time to relay signal to motor.
  },2000);
  doormotor.write(0); // This will be executed first, to trigger relay
}

exports.movedoor = movedoor;

function cleanup() {
  console.log("Cleaning up and Stopping...");

  doormotor.unexport();
  doorsensor.forEach(function (sensor) {
    sensor.unexport();
  });
}

exports.cleanup = cleanup;

function currentstate() {
  return garageCurrentState;
}

exports.currentstate = currentstate;
