var Gpio = require('onoff').Gpio;
var config = require('./config');
var email = require('./lib/mailer');
var camera = require('./lib/picture');
var state = config.states;
var otherSensorTriggered = false;
var garageCurrentState = state.UNKNOWN; 

// Setup Motor
var doormotor = [];
var doorlist = [];

(function setMotor() {

  if (config.motor) {
    var i = 0;
    Object.keys(config.motor).forEach(function (motors) {
      doorlist[i] = config.motor[motors];
      doormotor[i] = new Gpio(doorlist[i].pin, doorlist[i].status);
      console.log("Setup " + doorlist[i].name + "Motor with GPIO Pin: ", doorlist[i].pin);
      i += 1;
    });
    sendNotification("1L: Garage Setup and Ready");
  }

}());

function sendNotification(subject) {
  var file = '';

  if (config.camera.enable) {
    file = camera.takePicture();
    }
  if (config.mail.enable) {
    email.sendingMail(subject, file);
  }
}

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
	    
            sendNotification("1L: Garage is now " + garageCurrentState.desc);
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
function movedoor(side) {
  console.log("Moving the door..");

  setTimeout(function() {
    doormotor[side].write(1); // After a 2 second pause, reset the pin to 1/High, allowing time to relay signal to motor.
  },2000);
  doormotor[side].write(0); // This will be executed first, to trigger relay
}

function cleanup() {
  console.log("Cleaning up and Stopping...");

  doormotor.forEach(function (motors) {
    motors.unexport();
  });
  doorsensor.forEach(function (sensor) {
    sensor.unexport();
  });
}

function currentstate() {
  return garageCurrentState;
}

exports.currentstate = currentstate;
exports.movedoor = movedoor;
exports.cleanup = cleanup;
exports.doorlist = doorlist;
