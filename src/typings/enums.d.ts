/**
 * Definition of request authorization validation.
 */
export enum RouteAuth {
	/** The request must have valid authorization header set. The `auth` middleware is called. */
	REQUIRED = 2,
	/** The request is open for anyone. The `auth` middleware is never called. */
	DISABLED = 0,
	/** The request accepts authorization header. If it's set `auth` middleware is called. */
	OPTIONAL = 1,
}
