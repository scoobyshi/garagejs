var Gpio = require('onoff').Gpio;
var config = require('./config');
var email = require('./lib/mailer');
var camera = require('./lib/picture');
var logger = require('./lib/logger');
var state = config.states;
var defaultState = state.CLOSED;
var debounce = 1000; // debounce helper for 1s

// Setup Motor
var doorlist = [];

(function setMotor() {

    if (config.motor) {
        var i = 0;
        Object.keys(config.motor).forEach(function (motors) {
            doorlist[i] = config.motor[motors];
            doorlist[i].otherSensorTriggered = false;
            doorlist[i].garageCurrentState = defaultState;
            doorlist[i].doormotor = new Gpio(doorlist[i].pin, doorlist[i].status);
            logger.debug("Setup " + doorlist[i].name, "Motor with GPIO Pin: ", doorlist[i].pin);
            i += 1;
        });
        sendNotification("1L: Garage Setup and Ready");
    }

}());

function sendNotification(subject) {
    var file = '';

    if (config.mail.enable) {
        if (config.camera.enable) {
            setTimeout(function () {
                logger.debug("Available Filename: " + file);
                email.sendingMail(subject, file);
            }, 5000);
            file = camera.takePicture();
        } else {
            email.sendingMail(subject, file);
        }
    } else {
        logger.warn("No Email Notification Subscribed!");
    }
}

// Setup Sensors
var doorsensor = [];
(function setSensors() {

    Object.keys(config.motor).forEach(function (motor) {

        if (config.motor[motor].sensors) {
            var i = 0;
            doorlist[motor].lastchangetime = new Date();

            Object.keys(config.motor[motor].sensors).forEach(function (sensor) {

                var sens = config.motor[motor].sensors[sensor];
                logger.debug("Setup sensor ", sens.position, " on pin", sens.pin, " for motor", config.motor[motor].name);

                doorsensor[i] = new Gpio(sens.pin, sens.type, sens.edge, {debounceTimeout: sens.debounce});
                doorsensor[i].watch(function (err, value) {

                    if (err) {
                        throw err;
                    }

                    // debounce helper - confirm we're not seeing another change within some set amount of time
                    doorlist[motor].currenttime = new Date();
                    logger.debug("Using debounce helper and checking time, current time: ", doorlist[motor].currenttime, " versus last change time: ", doorlist[motor].lastchangetime);
                    logger.debug("Difference is: ", doorlist[motor].currenttime - doorlist[motor].lastchangetime, "ms");

                    if ((doorlist[motor].currenttime - doorlist[motor].lastchangetime) >= debounce) {

                        // when false, indicates a "falling" edge, which in turn indicates a magnet passing and a genuine event
                        if (value == false) {
                            logger.debug("Triggered Sensor ", sens.position, " on pin", sens.pin, " on motor", config.motor[motor].name, " at", new Date());

                            if (doorlist[motor].otherSensorTriggered == true) {

                                // if Top sensor (0) triggered and Other previous, then must be Closed
                                doorlist[motor].garageCurrentState = (sens.position === "top") ? state.OPEN : state.CLOSED;
                                doorlist[motor].otherSensorTriggered = false;
                                logger.info(doorlist[motor].name, "garage current state is ", doorlist[motor].garageCurrentState.desc, " at", new Date());

                                sendNotification("1L: The " + doorlist[motor].name + " garage door is now " + doorlist[motor].garageCurrentState.desc);
                            } else {

                                // if top sensor (0) then Closing, if bottom (1) then Opening; By knowing which sensor is triggered first we can recover from unknown state
                                doorlist[motor].garageCurrentState = (sens.position === "top") ? state.CLOSING : state.OPENING;
                                doorlist[motor].otherSensorTriggered = true;
                                logger.info(doorlist[motor].name, "garage changing state is ", doorlist[motor].garageCurrentState.desc, " at", new Date());

                                setTimeout(function() {
                                    if (doorlist[motor].garageCurrentState === state.CLOSING || doorlist[motor].garageCurrentState === state.OPENING) {
                                        logger.debug("Door is still ", doorlist[motor].garageCurrentState.desc, " resetting to default.");
                                        doorlist[motor].garageCurrentState = defaultState;
                                        doorlist[motor].otherSensorTriggered = false;
                                    } else {
                                        logger.debug("Door is confirmed ", doorlist[motor].garageCurrentState.desc);
                                    }
                                },120000);

                            }

                            doorlist[motor].lastchangetime = new Date();
                        }
                    }
                });

                i += 1;
            });
        }
    });
}());

// Control the Door Motor
function movedoor(door_id) {
    function finddoor(d) {
        return d.id === door_id;
    }
    var door = doorlist.find(finddoor);
    logger.debug("Moving the ", door.name, " door..");

    setTimeout(function () {
        door.doormotor.write(1); // After a 2 second pause, reset the pin to 1/High, allowing time to relay signal to motor.
    }, 2000);
    door.doormotor.write(0); // This will be executed first, to trigger relay
}

function cleanup() {
    logger.info("Cleaning up and Stopping...");

    doorlist.forEach(function (motors) {
        motors.doormotor.unexport();
    });
    doorsensor.forEach(function (sensor) {
        sensor.unexport();
    });
}

function currentstate(door_id) {
    function finddoor(d) {
        return d.id === door_id;
    }
    var door = doorlist.find(finddoor);

    return door.garageCurrentState;
}

function doors() {
    var doorLookup = [];
    var i = 0;
    doorlist.forEach(function (d) {
        doorLookup[i] = d.id;
        i += 1;
    });
    return doorLookup;
}

exports.currentstate = currentstate;
exports.movedoor = movedoor;
exports.cleanup = cleanup;
exports.doors = doors;
