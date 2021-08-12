import RSBaseError from '../base';

export default class MissingParameterError extends RSBaseError {

	constructor(parameter: string);
	constructor(parameter: string, payload: Record<string, any>);
	constructor(parameter: string, isArray: boolean);
	constructor(parameter: string, isArray: boolean, payload: Record<string, any>);
}
