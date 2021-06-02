import Field, { FieldShape, FieldShapeArray } from '../endpoint/field';

declare namespace Response {

	abstract class Base {
		public abstract getContentType(charset: string): string;
		public abstract get(array: boolean): Array<any> | any;
		public getData(data: { data: any, _meta?: any }, pretty: boolean): any;
		public getHeaders(): { [key: string]: string };
		public addHeader(header: string, value: any): this;
	}

	class JSON extends Base {
		fields: Array<Field | FieldShape | FieldShapeArray>;
		constructor();
		constructor(fields: Array<Field | FieldShape | FieldShapeArray>);
		getContentType(charset: string): string;
		get(array: boolean): Array<any> | any;
	}

	class Custom extends Base {
		private _contentType: string;
		constructor(contentType: string);
		getContentType(charset: string): string;
		get(array: boolean): Array<any> | any;
	}
}

export {
	Response as default,
};
