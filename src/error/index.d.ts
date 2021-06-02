import RSBaseError from './base';
import InvalidTypeError from './invalid-type';

export default class RSError extends RSBaseError {

	public static InvalidType: typeof InvalidTypeError;
}
