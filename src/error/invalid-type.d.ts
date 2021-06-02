import { Type } from '../typings/types';
import RSBaseError from './';

export default class InvalidTypeError extends RSBaseError {

	constructor(key: string, type: Type);
}
