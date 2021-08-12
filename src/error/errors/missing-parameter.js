import RSBaseError from '../base';

export default class MissingParameterError extends RSBaseError {

	constructor(parameter, isArray, payload) {
		if (typeof isArray === 'object') {
			payload = { ...isArray };
			isArray = false;
		}
		super(
			!isArray
				? `Parameter '${parameter}' is missing.`
				: `Parameter '${parameter}' cannot be an empty array.`,
			payload,
		);
	}

	getDescription() {
		return 'Returned if one of the required parameters is not defined.';
	}

	_getCode() {
		return 'missing_parameter';
	}

	_getStatusCode() {
		return RSBaseError.BAD_REQUEST;
	}
}
