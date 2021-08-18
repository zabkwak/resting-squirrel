import * as React from 'react';
import { LinearProgress, Button, Chip, Typography, Box, IconButton, Tooltip, ButtonGroup, TextField } from '@material-ui/core';
import SendIcon from '@material-ui/icons/Send';
import CloseIcon from '@material-ui/icons/Close';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import * as qs from 'querystring';
import ReactJson from 'react-json-view';
import classnames from 'classnames';
import uniqid from 'uniqid';
import CopyToClipboard from 'react-copy-to-clipboard';

import { IDocsItem, IField, IParam } from '../../typings';
import Title from '../title';
import Field from './field';
import Application from '../app';

import './styles.scss';
import Headers from './headers';

interface IOptionalProps {
	authHeader: string;
}

interface IProps extends Partial<IOptionalProps> {
	name: string;
	item: IDocsItem;
}

interface IState {
	jsonParams: boolean;
	jsonData: string;
	args: { [key: string]: any };
	params: { [key: string]: any };
	headers: Array<{ key: string, value: string, disabled?: boolean, id: string }>;
	response: {
		response: Response;
		data?: {
			data?: any;
			error?: {
				message: string;
				code: string;
			};
		};
		took: number;
	};
	executing: boolean;
}

const AUTH_STORAGE_KEY = 'auth-header';

export default class EndpointConsole extends React.Component<IProps, IState> {

	public static defaultProps: IOptionalProps = {
		authHeader: null,
	};

	public state: IState = {
		jsonParams: false,
		jsonData: '{\n\t\n}',
		params: {},
		response: null,
		executing: false,
		args: {},
		headers: [],
	};

	public UNSAFE_componentWillReceiveProps(nextProps: IProps): void {
		if (nextProps.name === this.props.name) {
			return;
		}
		this.setState({
			jsonParams: false,
			jsonData: '{\n\t\n}',
			params: {},
			response: null,
			executing: false,
			args: {},
			headers: [],
		});
	}

	public render(): JSX.Element {
		const { name, item, authHeader } = this.props;
		const { response, executing, headers } = this.state;
		const { args, params } = item;
		if (item.auth !== 'DISABLED' && !headers.length) {
			headers.push({
				key: this.props.authHeader,
				value: this._getFromStorage(AUTH_STORAGE_KEY),
				disabled: true,
				id: uniqid(),
			});
		}
		return (
			<>
				<IconButton
					onClick={() => Application.hideConsole()}
					color="secondary"
					className="float-right"
					size="medium"
				>
					<CloseIcon />
				</IconButton>
				<Title component="h2" variant="h4">{name}</Title>
				<form onSubmit={this._submit}>
					<Title component="h3" variant="h5">Headers</Title>
					<Headers
						headers={headers}
						onChange={(headers) => {
							const authHeader = headers.find(({ key }) => key === this.props.authHeader);
							if (authHeader) {
								this._saveToStorage(AUTH_STORAGE_KEY, authHeader.value);
							}
							this.setState({ headers });
						}}
						disabled={executing}
					/>
					{this.renderFields('Arguments', args, 'args')}
					{this.renderFields('Params', params, 'params')}
					<Box justifyContent="flex-end" display="flex" marginTop={2}>
						<Button
							variant="contained"
							type="submit"
							color="primary"
							endIcon={<SendIcon />}
							disabled={executing}
						>
							Submit
						</Button>
					</Box>
				</form>
				{
					executing && <LinearProgress />
				}
				{
					response &&
					<>
						<Title component="h3" variant="h5">
							Response
							{
								response.data &&
								<Tooltip title="Copy response">
									<CopyToClipboard
										text={JSON.stringify(response.data)}
										onCopy={() => Application.showSnackbar('Copied')}
										// @ts-ignore Hack for losing color of the button
										className="MuiButton-outlinedPrimary"
									>
										<Button
											variant="outlined"
											color="primary"
											size="small"
										>
											<FileCopyIcon />
										</Button>

									</CopyToClipboard>
								</Tooltip>
							}
						</Title>
						<Chip
							size="small"
							label={`${response.response.statusText} (${response.response.status})`}
							className={classnames(
								'console-response-status',
								response.response.ok ? 'ok' : 'error',
							)}
						/>
						<Typography component="span">
							Took: {response.took} ms
						</Typography>
						{
							response.data &&
							<ReactJson
								src={response.data}
								enableClipboard={false}
								name={false}
								displayDataTypes={false}
							/>
						}
					</>
				}
			</>
		);
	}

	public renderFields(
		title: string,
		fields: { [key: string]: IField | IParam },
		stateKey: keyof Omit<IState, 'jsonParams' | 'jsonData' | 'response' | 'executing' | 'headers'>,
	): JSX.Element {
		const { executing, jsonParams, jsonData, ...state } = this.state;
		if (!fields) {
			return null;
		}
		const entries = Object.entries(fields);
		if (!entries.length) {
			return null;
		}
		const params = stateKey === 'params';
		const renderJSONInput = params && jsonParams;
		return (
			<>
				<Title component="h3" variant="h5">{title}</Title>
				{
					params &&
					<ButtonGroup>
						<Button
							size="small"
							color={!jsonParams ? 'primary' : 'default'}
							onClick={() => this.setState({ jsonParams: false })}
						>
							Form
						</Button>
						<Button
							size="small"
							color={jsonParams ? 'primary' : 'default'}
							onClick={() => this.setState({ jsonParams: true })}
						>
							JSON
						</Button>
					</ButtonGroup>
				}
				{
					renderJSONInput &&
					<TextField
						fullWidth
						multiline
						label="JSON input (ctrl + enter to submit)"
						value={jsonData}
						onChange={({ target }) => this.setState({ jsonData: target.value })}
						onKeyDown={(e) => {
							if (e.keyCode === 9) {
								e.preventDefault();
								const { target } = e;
								const cursorIndex: number = (target as any).selectionStart;
								this.setState({
									jsonData: `${jsonData.substr(0, cursorIndex)}\t${jsonData.substr(cursorIndex)}`,
								}, () => {
									(target as any).selectionStart = cursorIndex + 1;
									(target as any).selectionEnd = cursorIndex + 1;
								});
								return;
							}
							if (e.ctrlKey && e.keyCode === 13) {
								this._submit();
								return;
							}
						}}
					/>
				}
				{
					!renderJSONInput &&
					entries.map(([name, field]) => (
						<Field
							key={name}
							name={name}
							type={field.type}
							required={params ? (field as IParam).required : false}
							shape={field.shape}
							shapeArray={field.shape_array}
							value={state[stateKey][name] || ''}
							onValueChanged={(value) => {
								// @ts-ignore
								this.setState({
									[stateKey]: {
										...state[stateKey],
										[name]: value,
									}
								});
							}}
							params={params}
							disabled={executing}
						/>
					))
				}
			</>
		);
	}

	private _submit = async (e?: React.FormEvent<HTMLFormElement>) => {
		const { name } = this.props;
		const { params, args, headers: stateHeaders, jsonData, jsonParams } = this.state;
		e?.preventDefault();
		const start = Date.now();
		this.setState({ executing: true, response: null });
		try {
			const [method, endpoint] = name.split(' ');
			const query = method === 'GET'
				? jsonParams
					? JSON.parse(jsonData)
					: this._sanitazeParams(params)
				: {};
			const body = method !== 'GET'
				? jsonParams
					? jsonData
					: JSON.stringify(this._sanitazeParams(params))
				: undefined;
			let url = `${Application.getBaseUrl()}${endpoint}?${qs.stringify({
				api_key: Application.getData('apiKey'),
				...query,
			})}`;
			Object.entries(args).forEach(([key, value]) => {
				url = url.replace(`:${key}`, value);
			});
			const headers = stateHeaders
				.filter(({ key }) => !!key)
				.reduce((acc: { [key: string]: string }, cur, i) => {
					acc[cur.key] = cur.value;
					return acc;
				}, {
					'Content-Type': 'application/json',
					'x-client': 'Docs console',
				});
			const r = await fetch(url, {
				method,
				body,
				headers,
			});
			const took = Date.now() - start;
			let data: any;
			if (r.status !== 204) {
				data = await r.json();
			}
			this.setState({ response: { response: r, data, took }, executing: false });
		} catch (e) {
			this.setState({
				response: {
					// @ts-ignore
					response: {
						status: 0,
						statusText: e.message || e,
					},
					took: Date.now() - start,
				},
				executing: false,
			});
		}
	};

	private _getFromStorage(key: string): string {
		return localStorage?.getItem(key) || '';
	}

	private _saveToStorage(key: string, value: string): void {
		localStorage?.setItem(key, value);
	}

	private _sanitazeParams(params: { [key: string]: any }): { [key: string]: any } {
		const r: { [key: string]: any } = {};
		for (const key in params) {
			if (typeof params[key] === 'object' && !(params[key] instanceof Array)) {
				r[key] = this._sanitazeParams(params[key]);
			}
			if (params[key]) {
				r[key] = params[key];
			}
		}
		return r;
	}
}
