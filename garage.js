var Gpio = require('onoff').Gpio;
var config = require('./config');
var otherSensorTriggered = false;
var garageChangeState = "Unknown"; // 0 - Closing, 1 - Opening, 2 - Stationary; Initialize as Stationary
var garageCurrentState = "Unknown"; // 0 - Closed, 1 - Open; Initialize as Closed
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

// if self.this sensor 0 (top) and othersensor already triggered then Open else if this sensor 1 (bottom) and other then Closed  
// Only an issue on startup since we don't know the state, unless we assume closed, or can detect which sensor

doorsensor[0].watch(function (err, value) {
  if (err) {
    throw err;
  }

  if (value == false) {
    console.log("Triggered Top Sensor, Confirm value is ", value);
    
    if (otherSensorTriggered == true) {

      // if this.sensor is top (0) then Open, if bottom (1) then Closed
      // garageCurrentState = (sensor === 0) ? "Open" : "Closed"; // if Top sensor (0) triggered and Other prev, must be Closed
      garageCurrentState = (garageChangeState === "Opening") ? "Open" : "Closed";

/*      if (garageChangeState == "Opening") 
	garageCurrentState = "Open";
      else // Closing
	garageCurrentState = "Closed"; */

      garageChangeState = "Stationary";
      otherSensorTriggered = false;
      
      console.log("Garage current state is ", garageCurrentState);
    } else {
      otherSensorTriggered = true;
      
      // if this.sensor is top (0) then Closing, if bottom (1) then Opening
      if (garageCurrentState == "Closed")
        garageChangeState = "Opening";
      else if (garageCurrentState == "Open")
        garageChangeState = "Closing"
      else
        garageChangeState = "Unknown";
     
      console.log("Garage changing state is ", garageChangeState);
    }
  }
});

doorsensor[1].watch(function (err, value) {
  if (err) {
    throw err;
  }

  if (value == false) {
    console.log("Trigger Bottom Sensor, Confirm value is ", value);

    if (otherSensorTriggered == true) {

      if (garageChangeState == "Opening")
        garageCurrentState = "Open";
      else // Closing
        garageCurrentState = "Closed";

      garageChangeState = "Stationary";
      otherSensorTriggered = false;

      console.log("Garage current state is ", garageCurrentState);
    } else {
      otherSensorTriggered = true;

      if (garageCurrentState == "Closed")
        garageChangeState = "Opening";
      else if (garageCurrentState == "Open")
        garageChangeState = "Closing"
      else
        garageChangeState = "Unknown";

      console.log("Garage changing state is ", garageChangeState);
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


