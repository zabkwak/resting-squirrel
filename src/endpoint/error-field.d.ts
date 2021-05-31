/** @deprecated */
export default class ErrorField {

	/** Error code. */
	public code: string;

	/** Description of the situations where the error is returned. */
	public description: string;

	/**
	 * 
	 * @param code Error code.
	 */
	constructor(code: string);
	/**
	 * 
	 * @param code Error code.
	 * @param description Description of the situations where the error is returned.
	 */
	constructor(code: string, description: string);
}