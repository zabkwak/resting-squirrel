import { AppBar, Grid, Toolbar, Typography, IconButton, Box, Snackbar } from '@material-ui/core';
import { Menu as MenuIcon } from '@material-ui/icons';
import * as React from 'react';
import * as ReactDom from 'react-dom';
import * as url from 'url';
import * as qs from 'querystring';

import { IDocs, IResponse } from '../typings';
import EndpointList from './endpoint-list';
import Title from './title';
import EndpointDocs from './endpoint-docs';
import EndpointConsole from './endpoint-console';

export interface IData {
	name: string;
	apiKey: string;
	rsVersion: string;
	version: string;
	dataKey: string;
	errorKey: string;
	meta: boolean;
	authKey: string;
	authDescription: string;
	docsRoute: string;
}

interface IProps {
	docs: IDocs;
}

interface IState {
	list: boolean;
	endpoint: string;
	showConsole: boolean;
	snackbar: string;
}

export default class Application extends React.Component<IProps, IState> {

	private static _data: IData;

	private static _refs: { [key: string]: React.Ref<any> } = {};

	public static async start(): Promise<void> {
		const response = await fetch(`${this.getData('docsRoute')}?api_key=${this.getData('apiKey')}`);
		const docs: IResponse<IDocs> = await response.json();
		ReactDom.render(<Application docs={docs.data} ref={(ref: any) => this.registerRef('app', ref)} />, document.getElementById('app'));
	}

	public static getData<K extends keyof IData>(key: K): IData[K] {
		if (!this._data) {
			const data = document.getElementById('initial-data').getAttribute('data-data');
			this._data = JSON.parse(data);
		}
		return this._data[key];
	}

	public static navigate(params: { [key: string]: string | number }, replace: boolean = false): void {
		const hash = this.getParams();
		const query = replace ? qs.encode(params) : qs.encode({ ...hash, ...params });
		location.href = `#${query}`
	}

	public static getUrl(params: { [key: string]: string | number }, absolute: boolean = true): string {
		let url: string = '';
		if (absolute) {
			url = `${this.getBaseUrl()}${this.getData('docsRoute')}.html`;
			if (this.getData('apiKey')) {
				url = `${url}?api_key=${this.getData('apiKey')}`;
			}
		}
		return `${url}#${qs.encode(params)}`;
	}

	public static getParams(): { [key: string]: string } {
		const { hash } = location;
		if (hash) {
			return qs.parse(hash.substr(1)) as { [key: string]: string };
		}
		return {};
	}

	public static getBaseUrl(): string {
		const { origin } = location;
		return origin;
	}

	public static registerRef(name: string, ref: any): void {
		this._refs[name] = ref;
	}

	public static getRef<T = any>(name: string): any {
		return this._refs[name];
	}

	public static scrollToRef(name: string): void {
		const ref: any = Application.getRef(name);
		if (ref) {
			//const content = document.getElementById('content');
			const content: HTMLDivElement = this.getRef('content');
			if (content.scrollTo) {
				content.scrollTo(0, ref.offsetTop - content.offsetTop);
			} else {
				content.scrollTop = ref.offsetTop - content.offsetTop;
			}
		}
	}

	public static setEndpoint(endpoint: string): void {
		const { console: showConsole } = Application.getParams();
		if (showConsole !== undefined) {
			this.showConsole(endpoint);
		}
	}

	public static showConsole(endpoint: string): void {
		(this.getRef('app') as Application).setState({ endpoint, showConsole: true });
		this.navigate({ console: '' });
	}

	public static hideConsole(): void {
		const { console: showConsole, ...params } = this.getParams();
		(this.getRef('app') as Application).setState({ showConsole: false });
		this.navigate(params, true);
	}

	public static showSnackbar(message: string): void {
		(this.getRef('app') as Application).setState({ snackbar: message }, () => {
			setTimeout(() => {
				(this.getRef('app') as Application).setState({ snackbar: null });
			}, 2000);
		});
	}

	public state: IState = {
		list: true,
		endpoint: null,
		showConsole: false,
		snackbar: null,
	};

	public componentDidMount(): void {
		const { docs } = this.props;
		const { anchor, endpoint, console: showConsole } = Application.getParams();
		if (anchor) {
			Application.scrollToRef(anchor);
		}
		if (endpoint) {
			this.setState({ endpoint });
		}
		if (showConsole !== undefined && docs[anchor]) {
			this.setState({ showConsole: true });
		}
	}

	public render(): JSX.Element {
		const { docs } = this.props;
		const { list, endpoint, showConsole, snackbar } = this.state;
		return (
			<>
				<AppBar position="static">
					<Toolbar>
						<IconButton
							edge="start"
							color="inherit"
							aria-label="menu"
							onClick={() => {
								this.setState({ list: !list });
							}}
						>
							<MenuIcon />
						</IconButton>
						<Typography variant="h4" component="h1">
							{Application.getData('name')} documentation
						</Typography>
					</Toolbar>
				</AppBar>
				<main>
					<Grid container className="h100">
						{
							list &&
							<Grid item xs={2} className="h100 p10">
								<EndpointList docs={docs} />
							</Grid>
						}
						<Grid
							item
							xs
							className="h100 overflow p10"
							id="content"
							ref={(ref) => Application.registerRef('content', ref)}
						>
							<Title component="h2" variant="h4">Description</Title>
							<Typography variant="body1">
								REST-like API with <code>JSON</code> input/output.
                			</Typography>
							<Typography variant="body1">
								The API is called as an http request on <code>{Application.getBaseUrl()}/[endpoint]</code> with required parameters.
                			</Typography>
							<Title link="input" component="h3">Input</Title>
							<Typography variant="body1">
								HTTP methods <code>POST</code>, <code>PUT</code> and <code>DELETE</code> are using JSON body as input parameters.
                    			So header <code>Content-Type: application/json</code> is required.<br />
								<code>GET</code> method is using query string for input parameters.
                			</Typography>
							<Title link="output" component="h3">Output</Title>
							<Typography variant="body1">
								The API is returning data in <code>JSON</code> string with <code>Content-Type: application/json</code> header if it's not defined otherwise.<br />
								The response contains <code>{Application.getData('dataKey')}</code> key with data object as specified in endpoint documentation under the Response block.<br />
								Or the <code>{Application.getData('errorKey')}</code> key if some error occures in the request process.
								The <code>{Application.getData('errorKey')}</code> contains <code>message</code> and <code>code</code> fields where the information about the error are stored.
								The error codes which can the endpoint return are in endpoint documentation under the Errors block.<br />
								If the endpoint is deprecated the response contains a deprecated info in <code>warning</code> key.
								{
									Application.getData('meta') &&
									<>
										<br />
										The response contains a <code>_meta</code> key with meta information about the request.
									</>
								}
							</Typography>
							<Title component="h4" variant="h6">204 response</Title>
							<Typography variant="body1">
								Some of endpoints can return an empty response (HTTP code 204). The endpoint documentation under the Response block is empty in this case.
                			</Typography>
							<Title link="types" component="h3">Types</Title>
							<Typography variant="body1">
								Arguments, params and response are using type definition. The casting of the type is defined in <a href="https://www.npmjs.com/package/runtime-type#types" target="_blank">here</a>.
                			</Typography>
							{
								Application.getData('apiKey') && Application.getData('apiKey') !== 'undefined' &&
								<>
									<Title link="api-key" component="h3">Api key</Title>
									<Typography variant="body1">
										The key for access to the API. It is an GET parameter and for acquiring one please contact the API developer.
									</Typography>
								</>
							}
							<Title link="authorization" component="h3">Authorization</Title>
							<Typography variant="body1">
								Endpoints requiring the authorization must be called with <code>{Application.getData('authKey')}</code> header. Otherwise the error response will be returned.
                			</Typography>
							{
								Application.getData('authDescription') &&
								<Typography variant="body1">
									{Application.getData('authDescription')}
								</Typography>
							}
							<Title link="reserved-getparams" component="h3">Reserved GET parameters</Title>
							<Title component="h4" variant="h6">nometa</Title>
							<Typography variant="body1">Hides meta data from the response.</Typography>
							<Title component="h4" variant="h6">pretty</Title>
							<Typography variant="body1">Prints the response for human reading.</Typography>
							<EndpointDocs
								docs={docs}
							/>
						</Grid>
						{
							endpoint && showConsole &&
							<Grid
								item
								xs={3}
								className="h100 overflow p10"
							>
								<EndpointConsole
									name={endpoint}
									item={docs[endpoint]}
									authHeader={Application.getData('authKey')}
								/>
							</Grid>
						}
					</Grid>
				</main>
				<footer>
					<Typography variant="body2">
						The documentation is automatically generetad based on the module app setup. There can be differences between the documented
						informations and the final result. In that case please contact the API developer if needed.
                <br /> Powered by{' '}
						<a href="https://www.npmjs.com/package/resting-squirrel/" target="_blank">Resting Squirrel</a> v{Application.getData('rsVersion')}.
				</Typography>
				</footer>
				<Snackbar
					anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
					open={!!snackbar}
					onClose={() => this.setState({ snackbar: null })}
					message={snackbar}
				/>
			</>
		);
	}
}
