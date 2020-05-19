import * as React from 'react';

import Title from '../title';
import { IDocs } from '../../typings';
import Item from './item';

interface IProps {
	docs: IDocs;
}

export default class EndpointDocs extends React.Component<IProps> {

	public render(): JSX.Element {
		const { docs } = this.props;
		return (
			<>
				<Title link="endpoints" component="h2" variant="h4">Endpoints</Title>
				{
					Object.entries(docs).map(([name, doc]) => (
						<Item
							key={name}
							name={name}
							item={doc}
						/>
					))
				}
			</>
		);
	}
}
