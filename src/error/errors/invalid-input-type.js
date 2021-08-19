import RSBaseError from '../base';

export default class InvalidInputTypeError extends RSBaseError {

	constructor(key, type, payload) {
		super(null, payload);
		this.message = `${this._getFieldType()} '${key}' has invalid type. It should be '${type}'.`;
	}

	getDescription() {
		return 'Returned if one of the parameters or arguments has invalid type.';
	}

	_getCode() {
		return 'invalid_type';
	}

	_getStatusCode() {
		return RSBaseError.BAD_REQUEST;
	}

	_getFieldType() {
		return 'Input';
	}
}
