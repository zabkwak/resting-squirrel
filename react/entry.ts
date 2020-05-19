import 'whatwg-fetch';
import 'promise-polyfill/src/polyfill';
import 'es7-object-polyfill';
import 'polyfill-array-includes';

import Application from './components/app';

(async() => {
	await Application.start();
})();
