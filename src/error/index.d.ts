import RSBaseError from './base';
import InvalidParameterTypeError from './errors/invalid-parameter-type';
import InvalidArgumentTypeError from './errors/invalid-argument-type';
import InvalidInputTypeError from './errors/invalid-input-type';
import MissingParameterError from './errors/missing-parameter';

export default class RSError extends RSBaseError {

	public static InvalidParameterType: typeof InvalidParameterTypeError;
	public static InvalidArgumentType: typeof InvalidArgumentTypeError;
	public static InvalidInputType: typeof InvalidInputTypeError;
	public static MissingParameter: typeof MissingParameterError;
}
