var garage = require('./garage.js');
const readline = require('readline');
const rl = readline.createInterface(process.stdin, process.stdout);

// Provide a CLI
console.log("Starting up and Waiting...");
rl.setPrompt('Type "move" to trigger motor and Ctrl-C to exit> ');
rl.prompt();
rl.on('line', function(line) {
  if (line == "move") {
    garage.movedoor();
  }  
  rl.prompt();
}).on('SIGINT', function() {
  console.log("Cleaning Up and Stopping...");

  garage.doormotor.unexport();
  garage.doorsensor.forEach(function (sensor) {
    sensor.unexport();
  });

  process.exit(0);
});
