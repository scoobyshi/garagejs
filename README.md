# garagejs
A simple Node.js CLI example application using GPIO on a Raspberry Pi to control a device (in this case a garage door), 
and recieve input on attached sensors (existing reed switches that monitor the limits of the door movement).  

## Dependencies
This example uses the helpful Node package [onoff](https://github.com/fivdi/onoff), use `npm install onoff`.

## Notes
One advantage of using Node.js over the [Python example](https://github.com/scoobyshi/garagepy), is the non-blocking event driven nature of Node.
This becomes important when interacting with the physical world as instructions are not always immediate, and are naturally more asyncronous.  Additionally, if 
you are monitoring and initiating with several different interfaces at once (sensors, motors, etc) you may miss critical events in a blocking regime.

- You will notice the use of the "onoff" optional parameter "debounceTimeout" (which in turn just uses Node.js setTimeout callback).  This is important 
as you may experience "noise" from the switch that would otherwise indicate a false-positive change in state.  
- I found a higher tolerance was required from the sensor closest to the motor and Pi, likely due to a slightly faster electrical change in state.

## Other Considerations
- With this example, we could leverage existing projects like [Homebridge](https://github.com/nfarina/homebridge) and the 
underlying [HAPNode-JS](https://github.com/KhaosT/HAP-NodeJS) to enable Siri control and feedback (Done, example coming soon)
- If you own a [Wink Hub](http://www.wink.com/products/wink-hub/), you could extend this example to interact with their API: http://docs.wink.apiary.io/

