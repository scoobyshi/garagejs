var Gpio = require('../node_modules/onoff').Gpio;
const readline = require('readline');
const rl = readline.createInterface(process.stdin, process.stdout);

// instead of "out", we use "high" to initialize the pin in a state that won't trigger the relay
doormotor = new Gpio(18, 'high');

// Note: a value of 0 implies a falling edge and 1 implies a rising edge.  When the magnet passes the sensor it will cause a falling edge
topsensor = new Gpio(23, 'in', 'falling', {debounceTimeout: 350});
// The top sensor, closest to the relay, needs a slightly longer debounce timeout likely due to proximity and travel of signal (faster)
bottomsensor = new Gpio(17, 'in', 'falling', {debounceTimeout: 200});

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

  if (value == false)
    console.log("Triggered Top Sensor, Confirm value is ", value);
});

bottomsensor.watch(function (err, value) {
  if (err) {
    throw err;
  }

  if (value == false)
    console.log("Trigger Bottom Sensor, Confirm value is ", value);
});

console.log("Starting up and Waiting...");
rl.setPrompt('Move Garage? Type "move" to trigger motor and Ctrl-C to exit> ');
rl.prompt();
rl.on('line', function(line) {
  if (line.trim() == "move") {
    movedoor();
  }  
  rl.prompt();
}).on('SIGINT', function() {
  cleanstop();
  process.exit(0);
});


