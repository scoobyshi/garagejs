var Gpio = require('onoff').Gpio;
const readline = require('readline');
const rl = readline.createInterface(process.stdin, process.stdout);

// instead of "out", we use "high" to initialize the pin in a state that won't trigger the relay
var doormotor = new Gpio(18, 'high');

// Note: a value of 0 implies a falling edge and 1 implies a rising edge.  When the magnet passes the sensor it will cause a falling edge
var topsensor = new Gpio(23, 'in', 'falling', {debounceTimeout: 400});
// The top sensor, closest to the relay, needs a slightly longer debounce timeout likely due to proximity and travel of signal (faster)
var bottomsensor = new Gpio(17, 'in', 'falling', {debounceTimeout: 200});

var topsensorTriggered, bottomsensorTriggered;
var garageChangeState = "Unknown", garageCurrentState = "Unknown";

function cleanstop() {
  doormotor.unexport();
  topsensor.unexport();
  bottomsensor.unexport();
  console.log("Cleaned Up and Stopping.");
}

function movedoor() {
  console.log("Moving the door..");

  setTimeout(function() {
    doormotor.write(0);
  },2000);

  doormotor.write(1);
}

topsensor.watch(function (err, value) {
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

bottomsensor.watch(function (err, value) {
  if (err) {
    throw err;
  }

  if (value == false) {
    console.log("Trigger Bottom Sensor, Confirm value is ", value);

    if (topsensorTriggered == true) {
      garageCurrentState = "Closed";
      garageChangeState = "Stationary";
      topsensorTriggered == false;

      console.log("Garage is Closed");
    } else {
      bottomsensorTriggered = true;
      garageChangeState = "Opening";

      console.log("Garage is Opening");
    }
  }
});

console.log("Starting up and Waiting...");
rl.setPrompt('Type "move" to trigger motor and Ctrl-C to exit> ');
rl.prompt();
rl.on('line', function(line) {
  if (line == "move") {
    movedoor();
  }  
  rl.prompt();
}).on('SIGINT', function() {
  cleanstop();
  process.exit(0);
});


