import HttpSmartError from 'http-smart-error';
import ErrorField from './endpoint/error-field';

/**
 * Subclass of http-smart-error.
 */
export default class RSError extends HttpSmartError {

	/**
	 * Converts the error to ErrorField for documentation.
	 */
	public static toErrorField(): ErrorField;

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
