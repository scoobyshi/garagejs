var Gpio = require('onoff').Gpio;
var config = require('./config');
var state = config.states;
var otherSensorTriggered = false;
var garageChangeState = state.STATIONARY; 
var garageCurrentState = state.UNKNOWN; 
const readline = require('readline');
const rl = readline.createInterface(process.stdin, process.stdout);

// Setup Motor
var doormotor;
(function setMotor() {
  if (config.motor) {
    doormotor = new Gpio(config.motor.pin, config.motor.status);
    console.log("Setup Motor with GPIO Pin: ", config.motor.pin);
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
    	  console.log("Triggered Sensor ", sensor, ". Confirm value of state is ", value);

	  if (otherSensorTriggered == true) {

 	    // if Top sensor (0) triggered and Other previous, then must be Closed
            // we could use garageChangeState, but it could be unknown since startup may be with door open or closed 
      	    garageCurrentState = (sensor === "topsensor") ? state.OPEN : state.CLOSED; 

            garageChangeState = state.STATIONARY;
            otherSensorTriggered = false;

      	    console.log("Garage current state is ", garageCurrentState);
    	  } else {
      	    otherSensorTriggered = true;

            // if top sensor (0) then Closing, if bottom (1) then Opening; By knowing which sensor is triggered first we can recover from unknown state
	    garageChangeState = (sensor === "topsensor") ? state.CLOSING : state.OPENING; 

      	    console.log("Garage changing state is ", garageChangeState);
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

// Provide a CLI
console.log("Starting up and Waiting...");
rl.setPrompt('Type "move" to trigger motor and Ctrl-C to exit> ');
rl.prompt();
rl.on('line', function(line) {
  if (line == "move") {
    movedoor();
  }  
  rl.prompt();
}).on('SIGINT', function() {
  console.log("Cleaning Up and Stopping...");

  doormotor.unexport();
  doorsensor.forEach(function (sensor) {
    sensor.unexport();
  });

  process.exit(0);
});


