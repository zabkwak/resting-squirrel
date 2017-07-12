module.exports = (message, code = "unknown") ->
	if message instanceof Error
		err = message
		@message = err.message
		@stack = err.stack
		@code = err.code or "ERR_#{code.toUpperCase()}"
	else
		@message = message
		@code = "ERR_#{code.toUpperCase()}"
		Error.captureStackTrace @, @

(require "util").inherits module.exports, Error