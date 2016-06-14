# garagejs
A simple Node.js CLI example application using GPIO on a Raspberry Pi to control a device (in this case a garage door), 
and receive input on attached sensors (existing reed switches that monitor the limits of the door movement).  

![GaragePi](./img/GaragePiAndRelay.jpg?raw=true "Garage Pi and Relay")

## Usage
- You can run `node cli.js`, and type "move" to trigger the relay connected to your garage door, assuming you've followed instructions on setting 
up the door (see [HomeForARest Garage Setup Part 1](https://homeforarest.info/2016/04/20/garage-of-things-part-1/))
- You could include this package in your Node project with `npm install garage-js`.

## Options
- Recently I've added NodeMailer for email notifications, and the ability to take pictures for your notification, if you have the Pi Camera.
- To enable and include pictures, update the config.json with the camera.enable option set to 1 (true).
- To enable mail notifications, in the config.json set the mail.enable option to 1 (true).  You will also need to rename config-example.mail.json 
to config.mail.json, and update the account information appropriately.

## Dependencies
This example uses the helpful Node package [onoff](https://github.com/fivdi/onoff), and NodeMailer for the optional email notification.

## Notes
One advantage of using Node.js over the [Python example](https://github.com/scoobyshi/garagepy), is the non-blocking event driven nature of Node.
This becomes important when interacting with the physical world as instructions are not always immediate, and are naturally more asynchronous.  Additionally, if 
you are monitoring and initiating with several different interfaces at once (sensors, motors, etc) you may miss critical events in a blocking regime.

- You will notice the use of the "onoff" optional parameter "debounceTimeout" (which in turn just uses Node.js setTimeout callback).  This is important 
as you may experience "noise" from the switch that would otherwise indicate a false-positive change in state.  
- For the sensors: a value of 0 implies a falling edge and 1 implies a rising edge.  When the magnet passes the sensor it will cause a falling edge.
- The actual switch, utilizing a relay, should be initialized "high"; If not specified it's possible on an unexpected restart of the Pi (eg power outage) that on startup of the app it may trigger the relay
and you come home to find the door open! 
- I found a higher tolerance was required from the sensor closest to the motor and Pi (the "Top" sensor), likely due to a slightly faster electrical change in state.

## Other Considerations
- With this example, we could leverage existing projects like [Homebridge](https://github.com/nfarina/homebridge) and the 
underlying [HAPNode-JS](https://github.com/KhaosT/HAP-NodeJS) to enable Siri control and feedback (Done, example coming soon)
- If you own a [Wink Hub](http://www.wink.com/products/wink-hub/), you could extend this example to interact with their API: http://docs.wink.apiary.io/
- Run this as a server instead of a CLI and initiate a text or Whatsapp message to indicate the door opening or closing
