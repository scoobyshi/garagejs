var garage = require('./garage.js');
const readline = require('readline');
const rl = readline.createInterface(process.stdin, process.stdout);

// Provide a CLI
console.log("Starting up and Waiting... ");

console.log("Available Doors:");
garage.doorlist.forEach(function (door) {
    console.log("Door ID " + door.id + ", use the name \"" + door.name + "\" to control the door on Pin: " + door.pin);
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
    garage.doorlist.forEach(function (door) {
        console.log("Door ID " + door.id + " has status " + door.garageCurrentState.desc);
    });

    garage.currentstate(1);

    garage.cleanup();
    process.exit(0);
});
