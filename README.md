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
```javascript
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
**requestLimit** Limit for input data. Default: 1mb  
**meta** Object for setting up the behaviour of meta data. 
- **enabled** If true meta data are showed in every request. Default: true  
- **data** Custom meta data for the application. This data are set for all endpoints. Default: {}

**log** If true access log and error log are written in stdout. Default: true  
**logStack** If true and log is enabled the stack trace is written in stdout. Default: true  
**docs** Object for setting up the documentation for the API.
- **enabled** If true docs are enabled on the *options.docs.endpoint* endpoint. Default: true  
- **endpoint** On this endpoint is shown documentation. Default: /docs  
- **auth** If true documentation request must be authorized with *options.auth* function. Default: false  

**auth(req, res, next)** Function to handle authorization. Default function checks if 'x-token' parameter is in headers.  
**before(req, res, next)** Function called before the endpoint execution. Default function just calls next().  
**after(err, data, req, res, next)** Function called after the endpoint execution. Default function just calls next().  

### Errors
Module has own Error class inherited from [Error](https://nodejs.org/api/errors.html#errors_class_error). Id adds code parameter to the error response. 
### Coffeescript
```coffeescript
rs = require "resting-squirrel"
console.log new rs.Error "Some error", "some_code"
```
### Javascript
```coffeescript
var rs = require("resting-squirrel");
console.log(new rs.Error("Some error", "some_code"));
```

### Functions  
**use(route, callback)** Registers express middleware. Route can be callback.  
**get(version, route, requiredAuth = false, requiredParams = [], docs = null, callback)** Registers route on the GET method. requiredAuth and requiredParams can be callback. Callback is taken from express.  
**post(version, route, requiredAuth = false, requiredParams = [], docs = null, callback)** Registers route on the POST method. requiredAuth and requiredParams can be callback. Callback is taken from express.  
**put(version, route, requiredAuth = false, requiredParams = [], docs = null, callback)** Registers route on the PUT method. requiredAuth and requiredParams can be callback. Callback is taken from express.  
**delete(version, route, requiredAuth = false, requiredParams = [], docs = null, callback)** Registers route on the DELETE method. requiredAuth and requiredParams can be callback. Callback is taken from express.  
**head(version, route, requiredAuth = false, requiredParams = [], docs = null, callback)** Registers route on the HEAD method. requiredAuth and requiredParams can be callback. Callback is taken from express.  
**listen()** Starts listening on the port from options.  

All http methods are using the same function for handling data. First parameter in the callback is error and second are data which are sent to the *options.dataKey* in response.

#### Response methods in the callback  
**send204()** Sets 204 http code and sends empty response.  
**send401(message = "Unauthorized request", code = "unauthorized_request")** Sets 401 http code and sends the Error instance.  
**send404(message = "Page not found", code = "page_not_found")** Sets 404 http code and sends the Error instance.   
**send501(message = "Not implemented", code = "not_implemented")** Sets 501 http code and sends Error instance.  
**addMeta(key, value)** Adds custom meta key and value for current request.  
**sendData(data)** Sends the data to the *options.dataKey* in response. DEPRECATED: You should use the callback in http methods  
**sendError(code = 500, message = "Server error", errorCode = "unknown")** Sets the code as http code and sends the Error instance.  

#### Reserved GET parameters
This parameters are updating behaviour of the current request.  
**nometa** If meta is enabled in config this parameter will disable it.  
**pretty** JSON response is printed for human reading.  