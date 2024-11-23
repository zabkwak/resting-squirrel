import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Box,
	Button,
	ButtonGroup,
	Card,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Table as MuiTable,
	Paper,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	TextField,
	Tooltip,
	Typography,
} from '@material-ui/core';
import AppsIcon from '@material-ui/icons/Apps';
import CodeIcon from '@material-ui/icons/Code';
import DescriptionIcon from '@material-ui/icons/Description';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import LinkIcon from '@material-ui/icons/Link';
import camelCase from 'camelcase';
import classnames from 'classnames';
import * as React from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
const { Parser }: any = require('html-to-react');

import { IDocsItem, IField, IParam } from '../../typings';
import Title from '../title';

import Table from './table';

import Application from '../app';
import './item.scss';
import { getDocsProperty } from './utils';

interface IProps {
	item: IDocsItem;
	name: string;
}

interface IState {
	tsDefinition: string;
}

const Panel = ({ title, children, button }: { title: string; children: React.ReactNode; button?: React.ReactNode }) => {
	return (
		<Accordion>
			<AccordionSummary expandIcon={<ExpandMoreIcon />}>
				<Title component="h6" variant="h6">
					{title}
					{button}
				</Title>
			</AccordionSummary>
			<AccordionDetails>{children}</AccordionDetails>
		</Accordion>
	);
};

const parser = new Parser();

export default class Item extends React.Component<IProps, IState> {
	public state: IState = {
		tsDefinition: null,
	};

	public render(): JSX.Element {
		const { item, name } = this.props;
		const { tsDefinition } = this.state;
		const { deprecated, auth, description, args, params, response, response_type, errors } = item;
		const [method, endpoint] = name.split(' ');
		return (
			<Paper
				// @ts-ignore
				className={classnames('endpoint', 'p10', deprecated && 'deprecated')}
				variant="outlined"
				ref={(ref: React.Ref<any>) => Application.registerRef(name, ref)}
			>
				<Title>{name}</Title>
				{deprecated && <Chip size="small" label="deprecated" className="deprecated" />}
				{auth === 'REQUIRED' && <Chip size="small" label="requires authorization" className="auth required" />}
				{auth === 'OPTIONAL' && <Chip size="small" label="optional authorization" className="auth optional" />}
				<Box>
					<ButtonGroup>
						<Tooltip title="Open in console">
							<Button variant="outlined" color="primary" onClick={() => Application.showConsole(name)}>
								<AppsIcon />
							</Button>
						</Tooltip>
						<Tooltip title="Copy documentation link">
							<CopyToClipboard
								text={Application.getUrl({ endpoint: name, anchor: name })}
								onCopy={() => this._showSnackbar('Copied')}
								// @ts-ignore Hack for losing color of the button
								className="MuiButton-outlinedPrimary"
							>
								<Button variant="outlined" color="primary">
									<DescriptionIcon />
								</Button>
							</CopyToClipboard>
						</Tooltip>
						<Tooltip title="Copy endpoint link">
							<CopyToClipboard
								text={`${Application.getBaseUrl()}${endpoint}?api_key=${Application.getData('apiKey')}`}
								onCopy={() => this._showSnackbar('Copied')}
								// @ts-ignore Hack for losing color of the button
								className="MuiButton-outlinedPrimary"
							>
								<Button variant="outlined" color="primary">
									<LinkIcon />
								</Button>
							</CopyToClipboard>
						</Tooltip>
					</ButtonGroup>
				</Box>
				<Card className="p10 bg-light">{parser.parse(description || '')}</Card>
				{this.renderFields('Arguments', args)}
				{this.renderFields('Params', params, true)}
				{response ? (
					response_type.indexOf('application/json') >= 0 ? (
						this.renderFields('Response', response)
					) : (
						<Panel title="Response">
							<Typography>
								Non JSON response -{'>'} <code>{response_type}</code>
							</Typography>
						</Panel>
					)
				) : null}
				{this.renderErrors(errors)}
				<Dialog open={!!tsDefinition} onClose={() => this.setState({ tsDefinition: null })} fullWidth>
					<DialogTitle>TypeScript definition</DialogTitle>
					<DialogContent>
						<CopyToClipboard text={tsDefinition} onCopy={() => Application.showSnackbar('Copied')}>
							<TextField
								InputProps={{
									readOnly: true,
								}}
								multiline
								value={tsDefinition || ''}
								fullWidth
								label="Definition (copy by clicking in the text field)"
							/>
						</CopyToClipboard>
					</DialogContent>
					<DialogActions>
						<Button onClick={() => this.setState({ tsDefinition: null })} color="primary">
							Close
						</Button>
					</DialogActions>
				</Dialog>
			</Paper>
		);
	}

	public renderFields(
		title: string,
		fields: { [key: string]: IField | IParam },
		params: boolean = false,
	): JSX.Element {
		const { name } = this.props;
		if (!fields) {
			return null;
		}
		const entries = Object.entries(fields);
		if (!entries.length) {
			return null;
		}
		return (
			<Panel
				title={title}
				button={
					<Tooltip title="TypeScript definition">
						<Button
							variant="outlined"
							color="primary"
							onClick={(e: any) => {
								e.stopPropagation();
								const interfaceName = camelCase(
									['i', name.replace(/\s/, '_').replace(/\//g, '_').replace(/\:/g, '_by_'), title],
									{ pascalCase: true },
								);
								const props = Object.entries(fields)
									.map(([key, field]) => {
										return getDocsProperty(key, field);
									})
									.join('\n')
									.split('\n')
									.map((row) => `\t${row}`);
								this.setState({
									tsDefinition: `export interface ${interfaceName} {\n${props.join('\n')}\n}`,
								});
							}}
							size="small"
						>
							<CodeIcon />
						</Button>
					</Tooltip>
				}
			>
				<Table items={entries.map(([_, item]) => item)} params={params} />
			</Panel>
		);
	}

	public renderErrors(errors: IDocsItem['errors']): JSX.Element {
		if (!errors) {
			return null;
		}
		const entries = Object.entries(errors);
		if (!entries.length) {
			return null;
		}
		return (
			<Panel title="Errors">
				<MuiTable>
					<TableHead>
						<TableRow>
							<TableCell component="th">Code</TableCell>
							<TableCell component="th">Description</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{entries.map(([code, description]) => (
							<TableRow key={code} hover>
								<TableCell>{code}</TableCell>
								<TableCell>{parser.parse(description)}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</MuiTable>
			</Panel>
		);
	}

	private _showSnackbar(message: string): void {
		Application.showSnackbar(message);
	}
}
