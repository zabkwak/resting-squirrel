export default class Benchmark {
	public total: number;
	private _name: string;
	private _map: { [label: string]: Date };
	private _started: boolean;
	constructor();
	constructor(name: string);
	public start(): this;
	public mark(label: string): this;
	public toJSON(): { [label: string]: number, total: number };
}
