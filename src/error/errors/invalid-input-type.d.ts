import { Type } from '../../typings/types';
import RSBaseError from '../base';

export default abstract class InvalidInputTypeError extends RSBaseError {

	constructor(key: string, type: Type);
	constructor(key: string, type: Type, payload: Record<string, any>);

	protected abstract _getFieldType(): string;
}
