# Resting Squirrel

Simple REST server with json input data. It uses [express](https://www.npmjs.com/package/express) functions for register endpoints. Non-existing routes are automatically handled and return 404 status.

## Installation

```bash
$ npm install resting-squirrel
```

## Usage
### Coffeescript
```coffeescript
rs = require "resting-squirrel"
app = rs()

app.get "/", (req, res, next) ->
	next no, "I'm running"

app.post "/", no, ["name"], (req, res, next) ->
	next no, "I'm running"

app.get "/documented", no, [], "I am documented endpoint.", (req, res, next) ->
	next no, "I'm running'"

app.listen()
```
### Javascript
```coffeescript
var rs = require("resting-squirrel");
var app = rs();

app.get("/", function (req, res, next) {
	next(false, "I'm running");
});

app.post("/", false, ["name"], function (req, res, next) {
	next(false, "I'm running");
});

app.get("/documented", false, [], "I am documented endpoint.", function (req, res, next) {
	next(false, "I'm running");
});

app.listen()
```
This usage will create the app with default options. 

### Options
**port** Port where the app listens. Default: 8080  
**dataKey** Key in the output where the data are sent. Default: data  
**errorKey** Key in the output where the error is sent. Default: error  
**meta** If true metadata are in the response. Default: true  
**docs** Object for setting up the documentation for the API.
- **enabled** If true docs are enabled on the *options.docs.endpoint* endpoint. Default: true  
- **endpoint** On this endpoint is shown documentation. Default: /docs  
- **auth** If true documentation request must be authorized with *options.auth* function. Default: false  

**auth(req, res, next)** Function to handle authorization. Default function checks if 'x-token' parameter is in headers.  

### Functions  
**use(route, callback)** Registers express middleware. Route can be callback.  
**get(route, requiredAuth = false, requiredParams = [], callback)** Registers route on the GET method. requiredAuth and requiredParams can be callback. Callback is taken from express.  
**post(route, requiredAuth = false, requiredParams = [], callback)** Registers route on the POST method. requiredAuth and requiredParams can be callback. Callback is taken from express.  
**put(route, requiredAuth = false, requiredParams = [], callback)** Registers route on the PUT method. requiredAuth and requiredParams can be callback. Callback is taken from express.  
**delete(route, requiredAuth = false, requiredParams = [], callback)** Registers route on the DELETE method. requiredAuth and requiredParams can be callback. Callback is taken from express.  
**head(route, requiredAuth = false, requiredParams = [], callback)** Registers route on the HEAD method. requiredAuth and requiredParams can be callback. Callback is taken from express.  
**listen()** Starts listening on the port from options.  

All http methods are using the same function for handling data. First parameter in the callback is error and second are data which are sent to the *options.dataKey* in response.

#### Response methods in the callback  
**send401(message = "Unauthorized request")** Sets 401 http code and sends the message.  
**send404(message = "Page not found")** Sets 404 http code and sends the message.  
**sendData(data)** Sends the data to the *options.dataKey* in response. DEPRECATED: You should use the callback in http methods