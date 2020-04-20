import * as ReactDom from 'react-dom';
import * as React from 'react';

import Application from './components/app';
import { IResponse, IDocs } from './typings';

(async() => {
	await Application.start();
})();