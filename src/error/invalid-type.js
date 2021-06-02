import RSBaseError from './base';

export default class InvalidTypeError extends RSBaseError {

	constructor(key, type) {
		super(`Argument '${key}' has invalid type. It should be '${type}'.`);
	}

	_getCode() {
		return 'invalid_type';
	}

	_getStatusCode() {
		return RSError.BAD_REQUEST;
	}
}
