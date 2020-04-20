export interface IDocsItem {
	description: string;
	args: {
		[key: string]: IField;
	};
	params: {
		[key: string]: IParam;
	};
	required_params: Array<string>;
	auth: 'OPTIONAL' | 'REQUIRED' | 'DISABLED';
	response: {
		[key: string]: IField;
	};
	response_type: string;
	errors: {
		[code: string]: string;
	};
	deprecated: boolean;
}

export interface IDocs {
	[key: string]: IDocsItem;
}

export interface IResponse<T> {
	[key: string]: T;
	_meta: any; // TODO
}

export interface IField {
	name: string;
	key: string;
	description: string;
	type: string;
}

export interface IParam extends IField {
	required: boolean;
}
