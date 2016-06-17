var garage = require('./garage.js');
const readline = require('readline');
const rl = readline.createInterface(process.stdin, process.stdout);

// Provide a CLI
console.log("Starting up and Waiting... ");
rl.setPrompt('Type "move-left" or "move-right" to trigger motor and Ctrl-C to exit, the Current state is ' + garage.currentstate().desc + '> ');
rl.prompt();
rl.on('line', function(line) {
  if (line == "move-left") {
    garage.movedoor(0);
  } else if (line == "move-right") {
    garage.movedoor(1);
  }
  rl.prompt();
}).on('SIGINT', function() {
  garage.cleanup();  
  process.exit(0);
});
