var Gpio = require('onoff').Gpio;
var config = require('./config');
var topsensorTriggered = false, bottomsensorTriggered = false;
var garageChangeState = "Unknown", garageCurrentState = "Unknown";
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
      // Move the watch functions here?
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

doorsensor[0].watch(function (err, value) {
  if (err) {
    throw err;
  }

  if (value == false) {
    console.log("Triggered Top Sensor, Confirm value is ", value);
    
    if (bottomsensorTriggered == true) { 
      garageCurrentState = "Open";
      garageChangeState = "Stationary";
      bottomsensorTriggered = false;
      
      console.log("Garage is Open");
    } else {
      topsensorTriggered = true;
      garageChangeState = "Closing";
      
      console.log("Garage is Closing");
    }
  }
});

doorsensor[1].watch(function (err, value) {
  if (err) {
    throw err;
  }

  if (value == false) {
    console.log("Trigger Bottom Sensor, Confirm value is ", value);

    if (topsensorTriggered == true) {
      garageCurrentState = "Closed";
      garageChangeState = "Stationary";
      topsensorTriggered = false;

      console.log("Garage is Closed");
    } else {
      bottomsensorTriggered = true;
      garageChangeState = "Opening";

      console.log("Garage is Opening");
    }
  }
});

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


