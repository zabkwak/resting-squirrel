$(document).ready(() => {
    const $content = $('#content');
    const $index = $('#index');
    const $console = $('#console');
    const { protocol, host } = location;
    const baseUrl = `${protocol}//${host}`;
    const getEndpointId = endpoint => endpoint.replace(/ |\//g, '-').replace(/\-+/g, '-').toLowerCase();
    const testConsole = (endpoint, { description, docs, args, params, response, required_auth, deprecated }) => {
        const [method, path] = endpoint.split(' ');
        const $consoleContent = $(`
            <div>
                <button type="button" class="close" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <h2>${endpoint}</h2>
            <form id="console-form" action="/" method="post">
                <h3>Headers</h3>
                <div>
                    <div class="headers"></div>
                    <a href="#" class="btn btn-link btn-sm add">Add header</a>
                </div>
                <h3>Arguments</h3>
                <div class="args">
                    ${Object.keys(args).map((key) => {
                const { description, type, required } = args[key];
                return `
                            <p class="form-group">
                                <input id="${key}" class="required form-control" type="text" name="${key}" placeholder="${key} (${type})" />
                            </p>
                        `;
            }).join('')}
                </div>
                <h3>Params</h3>
                <div class="params">
                    ${Object.keys(params).map((key) => {
                const { description, type, required } = params[key];
                return `
                            <p class="form-group">
                                <input id="${key}" class="required form-control" type="text" name="${key}" placeholder="${key} (${type})" />
                            </p>
                        `;
            }).join('')}
                </div>
                <p>
                    <input type="submit" value="Send" class="btn btn-primary" />
                </p>
            </form>
            <h3>Response</h3>
            <div class="response"></div>
        `);

        $console.html($consoleContent);

        const $response = $console.find('.response');
        const $headers = $console.find('.headers');

        const renderData = (error, data, status, took) => {
            $response.html(`
                <h4 class="badge badge-${error ? 'danger' : 'success'}">${error ? 'Error' : 'Success'} (${status}${error ? ` - ${error}` : ''})</h4>
                ${data.warning ? `<span class="badge badge-warning">${data.warning}</span>` : ''}
                <strong>Took: ${took} ms</strong>
                <pre><code>${JSON.stringify(data, null, 4) || ''}</code></pre>
            `);
        };

        $console.find('#console-form a.add').click((e) => {
            e.preventDefault();
            const $header = $(`
                <div class="form-group mb-2 form-inline">
                    <input class="form-control" placeholder="Name" type="text" name="name" />
                    <input class="form-control" placeholder="Value" type="text" name="value" />
                    <a href="#" class="btn btn-warning btn-sm form-control">x</a>
                </div>
            `);
            $header.find('a').click((e) => {
                e.preventDefault();
                $header.remove();
            });
            $headers.append($header);
        });

        $consoleContent.find('button.close').click((e) => {
            e.preventDefault();
            $console.hide();
        });

        $('#console-form').submit((e) => {
            e.preventDefault();
            $response.html(`<div class="text-center">
                <img src="//cdnjs.cloudflare.com/ajax/libs/galleriffic/2.0.1/css/loader.gif" alt="loading" />
            </div>`);
            const $form = $(e.target);
            const args = {};
            const data = {};
            const headers = { 'x-agent': 'Docs Console' };
            $form.find('.args input[type="text"]').each((index, input) => {
                const { name, value } = input;
                args[name] = value || void 0;
            });
            $form.find('.params input[type="text"]').each((index, input) => {
                const { name, value } = input;
                data[name] = value || void 0;
            });
            $form.find('.headers div.form-group').each((index, group) => {
                const $group = $(group);
                const name = $group.find('input[name="name"]').val();
                const value = $group.find('input[name="value"]').val();
                headers[name] = value || void 0;
            });
            const start = Date.now();
            let url = path;
            Object.keys(args).forEach((arg) => {
                url = url.replace(`:${arg}`, args[arg]);
            });
            $.ajax({
                method: method.toLowerCase(),
                data: method === 'GET' ? data : JSON.stringify(data),
                headers,
                dataType: 'json',
                contentType: 'application/json',
                url: `${url}?api_key=${API_KEY}`,
                error: ({ responseText, status }, textStatus, error) => {
                    renderData(error, JSON.parse(responseText), status, Date.now() - start);
                },
                success: (response, textStatus, { status }) => {
                    renderData(null, response, status, Date.now() - start);
                },
            });
        });
    };
    const formatParams = (params, response = false) => {
        if (!params) {
            return '';
        }
        const keys = Object.keys(params);
        if (!keys.length) {
            return '';
        }
        const $table = $(`<table class="table"><thead><tr><th>Field</th><th>Type</th><th>Description</th><th>${response ? '' : 'Required'}</th></tr></thead><tbody></tbody></table>`);
        const $tbody = $table.find('tbody');
        keys.forEach((key) => {
            const { description, type, required, shape, shape_array } = params[key];
            let typeCell = type;
            if (shape) {
                typeCell = formatParams(shape, response);
            } else if (shape_array) {
                typeCell = `[]${formatParams(shape_array, response)}`;
            }
            $tbody.append(`
            <tr>
                <td>${key}</td>
                <td>${typeCell}</td>
                <td>${description}</td>
                <td>${response ? '' : (required ? '<i class="fa fa-check-circle"></i>' : '<i class="fa fa-times-circle"></i>')}</td>
            </tr>
            `);
        });
        return $table.prop('outerHTML');
    };
    const formatErrors = (errors) => {
        if (!errors) {
            return '';
        }
        const keys = Object.keys(errors);
        if (!keys.length) {
            return '';
        }
        $table = $(`<table class="table"><thead><tr><th>Code</th><th>Description</th><th></th><th></th></tr></thead><tbody></tbody></table>`);
        $tbody = $table.find('tbody');
        keys.forEach((code) => {
            const description = errors[code];
            $tbody.append(`<tr><td>${code}</td><td>${description}</td><td></td><td></td></tr>`);
        });
        return $table.prop('outerHTML');
    };
    const formatDocs = (endpoint, { description, docs, params, response, required_auth, deprecated, args, errors }) => {
        const id = getEndpointId(endpoint);
        const { origin, pathname, hash } = location;
        const link = `${origin}${pathname}#${id}`;
        const $docs = $(`
            <div id='${id}' class="endpoint${deprecated ? ' deprecated' : ''}">
                <h3>${endpoint}</h3>
                <div class="docs">
                    <div>
                        ${deprecated ? '<span class="badge badge-danger">DEPRECATED</span>' : ''}
                        ${required_auth ? '<span class="badge badge-warning">REQUIRES AUTHORIZATION</span>' : ''}     
                    </div>  
                    <div class="btn-group">
                        <a class="copy-link btn btn-outline-info" href="${link}">copy documentation link</a>     
                        <a class="copy-link btn btn-outline-info" href="${baseUrl}${endpoint.split(' ')[1]}">copy endpoint link</a>   
                        <a class="test-link btn btn-outline-info" href="#${id}">test in console</a>
                    </div>        
                    <p class="description card card-body bg-light">${description || docs}</p>
                    <h4>Arguments</h4>
                    ${formatParams(args, true)}
                    <h4>Params</h4>
                    ${formatParams(params)}
                    <h4>Response</h4>
                    ${formatParams(response, true)}
                    <h4>Errors</h4>
                    ${formatErrors(errors)}
                </div>
            </div>
        `);
        const $docsContent = $docs.find('.docs');
        $docs.find('a.copy-link').click((e) => {
            e.preventDefault();
            const $link = $(`<input class="link" type="text" value="${e.target.href}" />`);
            $docs.append($link);
            $link[0].select();
            document.execCommand('copy');
            $link.remove();
        });
        $docs.find('a.test-link').click((e) => {
            e.preventDefault();
            testConsole(endpoint, { description, docs, params, response, required_auth, deprecated, args });
            $console.show();
        });
        return $docs;
    };
    $.ajax({
        dataType: 'json',
        url: `/docs?api_key=${API_KEY}`,
        headers: { 'x-agent': 'Docs' },
        success: ({ data, _meta }) => {
            $content.html(`
                <h2>Description</h2>
                <p>
                    REST-like API with <code>JSON</code> input/output. 
                </p>
                <p>
                    The API is called as an http request on <code>${baseUrl}/[endpoint]</code> with required parameters.
                </p>
                <h3>Input</h3>
                <p>
                    HTTP methods <code>POST</code>, <code>PUT</code> and <code>DELETE</code> are using JSON body as input parameters. 
                    So header <code>Content-Type: application/json</code> is required.<br />
                    <code>GET</code> method is using query string for input parameters.
                </p>
                <h3>Output</h3>
                <p>
                    The API is returning data in <code>JSON</code> string with <code>Content-Type: application/json</code> header.<br />
                    The response contains <code>${DATA_KEY}</code> key with data object as specified in endpoint documentation under the Response block.<br />
                    Or the <code>${ERROR_KEY}</code> key if some error occures in the request process. 
                    The <code>${ERROR_KEY}</code> contains <code>message</code> and <code>code</code> fields where the information about the error are stored. 
                    The error codes which can the endpoint return are in endpoint documentation under the Errors block.<br />
                    If the endpoint is deprecated the response contains a deprecated info in <code>warning</code> key.
                    ${META ? '<br />The response contains a <code>_meta</code> key with meta information about the request.' : ''}
                </p>
                <h4>204 response</h4>
                <p>
                    Some of endpoints can return an empty response (HTTP code 204). The endpoint documentation under the Response block is empty in this case.
                </p>
                ${API_KEY && API_KEY !== 'undefined' ? '<h3>Api key</h3><p>The key for access to the API. It is an GET parameter and for acquiring one please contact the API developer.</p>' : ''}
                <h3>Reserved GET parameters</h3>
                <h4>nometa</h4>
                <p>Hides meta data from the response.</p>
                <h4>pretty</h4>
                <p>Prints the response for human reading.</p>
                <h2>Endpoints</h2>
            `);
            $index.html('<div class="list-group list-group-flush"></div>');
            $ul = $index.find('div.list-group');
            Object.keys(data).forEach((endpoint) => {
                $content.append(formatDocs(endpoint, data[endpoint]));
                const { deprecated } = data[endpoint];
                $ul.append(`<a class="list-group-item${deprecated ? ' deprecated' : ''}" href="#${getEndpointId(endpoint)}">${endpoint}</a>`);
            });
            if (location.hash) {
                location.href = location.hash;
            }
        },
    });
});