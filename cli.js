var garage = require('./garage.js');
const readline = require('readline');
const rl = readline.createInterface(process.stdin, process.stdout);

// Provide a CLI
console.log("Starting up and Waiting... Current State of Garage is ", garage.currentstate());
rl.setPrompt('Type "move" to trigger motor and Ctrl-C to exit, the Current state is ' + garage.currentstate() + '> ');
rl.prompt();
rl.on('line', function(line) {
  if (line == "move") {
    garage.movedoor();
  }  
  rl.prompt();
}).on('SIGINT', function() {
  garage.cleanup();  
  process.exit(0);
});
