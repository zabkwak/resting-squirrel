# Changelog

## 2.19.4
### Updates
- Updated dependencies.

## 2.19.3
### Docs
- Saving auth header to the `localStorage`.
### Updates
- Updated dependencies.

## 2.19.2
### Docs
- Removed browser check of required fields in the console.

## 2.19.1
### Fixes
- Array fields in docs console.

## 2.19.0
### Updates
- React documentation based on Material UI.

## 2.18.0
### Features
- Optional `Shape` properties.

## 2.17.9
### Updates
- Updated type definition.

## 2.17.8
### Updates
- Updated dependencies.

## 2.17.7
### Updates
- Updated dependencies.

## 2.17.6
### Updates
- Locked express types.

## 2.17.5
### Updates
- Updated dependencies.

## 2.17.4
### Updates
- package-lock.json not included in the package

## 2.17.3
### Updates
- Locked `@types/express-serve-static-core` dependency. 

## 2.17.2
### Updates
- Data are converted to json before the types validation

## 2.17.1
### Fixes
- Wrong handling of log level

## 2.17.0
### Features
- Methods to register before and after execution instead of options
### Fixes
- Unknown log options in the deprecated options validation

## 2.16.0
### Features
- Custom props of the endpoint

## 2.15.0
### Features
- Optional authorization of the endpoint
### Updates
- Migrated to babel 7

## 2.14.1
### Fixes
- Removed stack in the type error response

## 2.14.0
### Updates
- Type error returned in error response if the params have invalid types

## 2.13.0
### Features
- Option to set non-json response of the endpoint

## 2.12.11
### Changes
- Updated dependencies

## 2.12.10
### Changes
- Updated type definition

## 2.12.9
### Changes
- Updated type definition

## 2.12.8
### Fixes
- Missing return in `Application.getDocs` method

## 2.12.7
### Changes
- Access to docs synchronously

## 2.12.6
### Changes
- Updated type definition

## 2.12.5
### Fixes
- Crash if options are not defined directly in the `Application` class

## 2.12.4
### Changes
- Support routes registered from the constructor of the `Application`

## 2.12.3
### Changes
- Updated type definition
- Exported `Application` class

## 2.12.2
### Changes
- Changelog
### Docs
- Fixed broken console if headers in storage are not stored

## 2.12.1
### Changes
- Updated type definition

## 2.12.0
### Features
- Stop method in the application
- Auth validator can use `Promise`
- Invalid access token error code added to errors list
- Accessing to the request's benchmark
- Charset in app options
### Docs
- Using local storage to store used headers

## 2.11.1
### Changes
- Updated type definition

## 2.11.0
### Features
- Timeout option in application and endpoint
- Logging stats
- Log level

## 2.10.7
### Features
- Trying to get http status code from error passed to the error middleware

## 2.10.6
### Changes
- Updated type definition

## 2.10.5
### Changes
- Passing type error from `runtime-type` module in the response fields casting

## 2.10.4
### Features
- Internal benchmark
### Changes
- Logging refactoring
- Favicon.icon returns 204
- Removed callback hell in the start method
### Fixes
- Callback validation in the start method

## 2.10.3
### Docs
- Search in endpoint list
- Enum type as select box
- Boolean type as select box

## 2.10.2
### Docs
- Added app version to the docs html

## 2.10.1
### Docs
- Absolute paths in the requests

## 2.10.0
### Features
- Api keys are validated before the checking the endpoint
- Api keys exclude in the endpoint
- Api key validator can use `Promise`

## 2.9.5
### Changes
- Updated type definition

## 2.9.4
### Changes
- Updated type definition

## 2.9.3
### Changes
- Updated type definition

## 2.9.2
### Changes
- Merging meta data instead of rewriting
### Docs
- Handling unknown error if the API app is down
- Leaving console open after the endpoint change
- Endpoint count in the endpoint list
- Checkbox to hide deprecated endpoints in the endpoint list

## 2.9.1
### Changes
- Added response field in the logger method

## 2.9.0
### Features
- Callback function in endpoint can return a `Promise`

## 2.8.11
### Changes
- Updated type definition

## 2.8.10
### Changes
- Updated type definition

## 2.8.9
### Changes
- Updated type definition

## 2.8.8
### Changes
- Updated type definition

## 2.8.7
### Changes
- Updated type definition

## 2.8.6
### Changes
- TypeScript definition

## 2.8.5
### Docs
- Relative paths to the static files

## 2.8.4
### Features
- API key can be disabled on the endpoint level

## 2.8.3
### Features
- Ping endpoint

## 2.8.2
### Changes
- API key passed to the `express.Request`
- Access token passed to the `express.Request`
### Fixes
- Fixed crash in the response validation if the response is not defined

## 2.8.1
### Docs
- Wrapped long endpoint names

## 2.8.0
### Changes
- Callback execution catches Promise rejections
### Features
- Auth option as an object
### Docs
- Anchors to the sections
- New auth option
