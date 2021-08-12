import InvalidInputTypeError from './invalid-input-type';

export default class InvalidParameterTypeError extends InvalidInputTypeError {
	protected _getFieldType(): string;
 }
