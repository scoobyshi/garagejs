var garage = require('./garage.js');
const readline = require('readline');
const rl = readline.createInterface(process.stdin, process.stdout);
var logger = require('./lib/logger');

// Provide a CLI
logger.info("Starting up and Waiting... ");

console.log("Available Doors:");
garage.doors().forEach(function (door) {
    console.log("Door ID " + door);
});

console.log("Commands:");
console.log("  move door <id>");
console.log("  check door <id>");

rl.setPrompt("Enter Command or Ctrl-C to exit>");
rl.prompt();
rl.on('line', function (line) {
    if (line == "move door 1") {
        garage.movedoor(1);
    } else if (line == "move door 2") {
        garage.movedoor(2);
    }
    rl.prompt();
}).on('SIGINT', function () {
    garage.doors().forEach(function (door) {
        logger.debug("Door ID " + door + " has status " + garage.currentstate(door).desc);
    });

    garage.cleanup();
    process.exit(0);
});
