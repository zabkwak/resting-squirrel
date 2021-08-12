import InvalidInputTypeError from './invalid-input-type';

export default class InvalidArgumentTypeError extends InvalidInputTypeError {

	getDescription() {
		return 'Returned if one of the arguments has invalid type.';
	}

	_getFieldType() {
		return 'Argument';
	}
}
