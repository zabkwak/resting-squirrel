import InvalidInputTypeError from './invalid-input-type';

export default class InvalidArgumentTypeError extends InvalidInputTypeError {
	protected _getFieldType(): string;
}
