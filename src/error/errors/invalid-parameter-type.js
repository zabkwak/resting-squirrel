import InvalidInputTypeError from './invalid-input-type';

export default class InvalidParameterTypeError extends InvalidInputTypeError {

	getDescription() {
		return 'Returned if one of the parameters has invalid type.';
	}

	_getFieldType() {
		return 'Parameter';
	}
}
