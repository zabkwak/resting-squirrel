import * as React from 'react';
import { LinearProgress, Button, Chip, Typography, Box, IconButton, Tooltip } from '@material-ui/core';
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

export default class EndpointConsole extends React.Component<IProps, IState> {

	public static defaultProps: IOptionalProps = {
		authHeader: null,
	};

	public state: IState = {
		jsonParams: false,
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
			headers.push({ key: this.props.authHeader, value: '', disabled: true, id: uniqid() });
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
						onChange={(headers) => this.setState({ headers })}
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
		stateKey: keyof Omit<IState, 'jsonParams' | 'response' | 'executing' | 'headers'>,
	): JSX.Element {
		const { executing, ...state } = this.state;
		if (!fields) {
			return null;
		}
		const entries = Object.entries(fields);
		if (!entries.length) {
			return null;
		}
		const params = stateKey === 'params';
		return (
			<>
				<Title component="h3" variant="h5">{title}</Title>
				{
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

	private _submit = async (e: React.FormEvent<HTMLFormElement>) => {
		const { name } = this.props;
		const { params, args, headers: stateHeaders } = this.state;
		e.preventDefault();
		this.setState({ executing: true, response: null });
		const [method, endpoint] = name.split(' ');
		const start = Date.now();
		let url = `${Application.getBaseUrl()}${endpoint}?${qs.stringify({
			api_key: Application.getData('apiKey'),
			...(method === 'GET' ? params : {}),
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
		try {
			const r = await fetch(url, {
				method,
				body: method !== 'GET' ? JSON.stringify(params) : undefined,
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
}
