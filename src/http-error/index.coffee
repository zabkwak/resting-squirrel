SmartError = require "smart-error"

codes = require "./codes"

module.exports = class HttpError extends SmartError

    constructor: (statusCode, message, code, payload = {}) ->
        super message, code, Object.assign(payload, statusCode: statusCode)


HttpError.create = (statusCode, message = null, code = null, payload = {}) ->
    c = @getCode statusCode

    new @ statusCode, message or c.message, code or c.code, payload

HttpError.getCode = (statusCode) -> codes[statusCode] or codes[500]