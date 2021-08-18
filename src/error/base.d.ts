import HttpSmartError from 'http-smart-error';

import { IErrorField } from '../typings/interfaces';

/**
 * Subclass of http-smart-error.
 */
export default abstract class RBaseError extends HttpSmartError {

	/**
	 * Converts the error to ErrorField for documentation.
	 */
	public static toErrorField(): IErrorField;

	/**
	 * Creates new instance with default values.
	 */
	constructor();
	/**
	 * Creates new instance with overridden message.
	 * @param message Message of the error.
	 */
	constructor(message: string);
	/**
	 * Creates new instance with overridden message and payload data.
	 * @param message Message of the error.
	 * @param payload Additional data.
	 */
	constructor(message: string, payload: Record<string, any>);

	/**
	 * Converts the error to ErrorField for documentation.
	 */
	public toErrorField(): IErrorField;

	/**
	 * Gets the description of the error.
	 */
	public getDescription(): string;

	/**
	 * Gets the status code of the error.
	 */
	protected _getStatusCode(): number;

	/**
	 * Gets the error code of the error.
	 */
	protected _getCode(): string;

	/**
	 * Gets the default message of the error.
	 */
	protected _getMessage(): string;
}
