class StorageWrapper {

    set(key, value) {
        if (!localStorage) {
            return;
        }
        localStorage.setItem(key, JSON.stringify({ __data__: value }));
    }

    get(key) {
        if (!localStorage) {
            return null;
        }
        const data = localStorage.getItem(key);
        if (!data) {
            return null;
        }
        return JSON.parse(data).__data__;
    }

    remove(key) {
        if (!localStorage) {
            return;
        }
        localStorage.removeItem(key);
    }

    size() {
        if (!localStorage) {
            return 0;
        }
        return localStorage.length;
    }
}

$(document).ready(() => {
    const storage = new StorageWrapper();
    const $content = $('#content');
    const $index = $('#index');
    const $console = $('#console');
    const { protocol, host, pathname } = location;
    const baseUrl = `${protocol}//${host}${pathname.replace(`${DOCS_ROUTE}-legacy.html`, '')}`;

    let consoleOpened = false;

    const getEndpointId = endpoint => endpoint.replace(/ |\//g, '-').replace(/\-+/g, '-').toLowerCase();
    const className = (...args) => args.filter(item => Boolean(item)).join(' ');
    const testConsole = (endpoint, { description, docs, args, params, response, required_auth, deprecated, auth }) => {
        consoleOpened = true;
        const [method, path] = endpoint.split(' ');
        const storedHeaders = storage.get('headers') || {};
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
                    <div class="headers">
                        ${['REQUIRED', 'OPTIONAL'].includes(auth) ? `
                            <div class="form-group mb-2 form-inline">
                                <input class="form-control" placeholder="Name" type="text" name="name" readonly value="${AUTH_KEY}" />
                                <input class="form-control" placeholder="Value" type="text" name="value" value="${storedHeaders[AUTH_KEY] || ''}" />
                            </div>
                            ` : ''}
                            ${
            Object.keys(storedHeaders || []).map((key) => {
                if ([AUTH_KEY, 'x-agent'].includes(key)) {
                    return null;
                };
                return `
                                        <div class="form-group mb-2 form-inline">
                                            <input class="form-control" placeholder="Name" type="text" name="name" value="${key}" />
                                            <input class="form-control" placeholder="Value" type="text" name="value" value="${storedHeaders[key]}" />
                                            <a href="#" class="btn btn-warning btn-sm form-control">x</a>
                                        </div>
                                    `
            }).join('')
            }
                    </div>
                    <a href="#" class="btn btn-link btn-sm add header">Add header</a>
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
                const { description, type, required, shape, shape_array } = params[key];
                if (shape) {
                    // TODO
                }
                if (shape_array) {
                    // TODO
                }
                if (type.lastIndexOf('[]') === type.length - 2) {
                    const elementType = type.substr(0, type.length - 2);
                    return `
                                <div class="array-wrapper" id="${key}" data-type="${elementType}">
                                    <strong>${key}</strong>
                                    <p class="form-group row">
                                        <label for="${key}-0" class="col-sm-3 col-form-label">element</label>
                                        <input id="${key}-0" class="col-sm-7 form-control array" type="text" name="${key}[]" placeholder="${elementType.replace(/"/g, '&quot;')}" />
                                    </p>
                                    <a href="#" class="btn btn-link btn-sm add element">Add element</a>
                                </div>

                            `;
                }
                if (type === 'boolean') {
                    return `
                        <p class="form-group row">
                            <label for="${key}" class="col-sm-3 col-form-label">${key}</label>
                            <select id="${key}" class="col-sm-7 form-control" name="${key}">
                                <option value=""></option>
                                <option value="true">true</option>
                                <option value="false">false</option>
                            </select>
                        </p>  
                    `;
                }
                if (type.indexOf('enum') === 0) {
                    return `
                        <p class="form-group row">
                            <label for="${key}" class="col-sm-3 col-form-label">${key}</label>
                            <select id="${key}" class="col-sm-7 form-control" name="${key}">
                                <option value=""></option>
                                ${type.match(/'[^,(?! )]+'/g).map(t => `<option value="${t.replace(/'/g, '')}">${t.replace(/'/g, '')}</option>`).join('')}
                            </select>
                        </p>  
                    `;
                }
                return `
                            <p class="form-group row">
                                <label for="${key}" class="col-sm-3 col-form-label">${key}</label>
                                <input id="${key}" class="col-sm-7 form-control" type="text" name="${key}" placeholder="${type.replace(/"/g, '&quot;')}" />
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
                ${data && data.warning ? `<span class="badge badge-warning">${data.warning}</span>` : ''}
                <strong>Took: ${took} ms</strong>
                <pre><code>${JSON.stringify(data, null, 4) || ''}</code></pre>
            `);
        };

        $console.find('#console-form a.add.header').click((e) => {
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
        $headers.find('a.btn-warning').click((e) => {
            e.preventDefault();
            const $header = $(e.target).parent();
            $header.remove();
        });

        $console.find('#console-form a.add.element').click((e) => {
            e.preventDefault();
            const $parent = $(e.target.parentNode);
            const key = e.target.parentNode.id;
            const $this = $(e.target);
            const type = $parent.attr('data-type');
            const $el = $(`
                <p class="form-group row">
                    <label for="${key}-1" class="col-sm-3 col-form-label">element</label>
                    <input id="${key}-1" class="col-sm-7 form-control array" type="text" name="${key}[]" placeholder="${type.replace(/"/g, '&quot;')}" />
                    <a href="#" class="col-sm-1 remove"><i class="fa fa-times-circle"></i></a>
                </p>
            `);
            $el.find('a.remove').click((e) => {
                e.preventDefault();
                $el.remove();
            });
            $el.insertBefore($this);
        });

        $consoleContent.find('button.close').click((e) => {
            e.preventDefault();
            $console.hide();
            consoleOpened = false;
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
            // Arguments
            $form.find('.args input[type="text"]').each((index, input) => {
                const { name, value } = input;
                args[name] = value || void 0;
            });
            // Params
            $form.find('.params input[type="text"], .params select').each((index, input) => {
                const { name, value } = input;
                if (!value) {
                    return;
                }
                let val = value;
                // Try decode value as json string to JS Object
                try {
                    val = JSON.parse(val);
                } catch (e) { }
                // If the input is array element add its value to the array field
                if (input.classList.contains('array')) {
                    const n = name.substr(0, name.length - 2);
                    if (!data[n]) {
                        data[n] = [];
                    }
                    data[n].push(val);
                    return;
                }
                data[name] = val;
            });
            // Headers
            $form.find('.headers div.form-group').each((index, group) => {
                const $group = $(group);
                const name = $group.find('input[name="name"]').val();
                const value = $group.find('input[name="value"]').val();
                headers[name] = value || void 0;
            });
            storage.set('headers', headers);
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
                url: `${baseUrl}${url}?api_key=${API_KEY}`,
                timeout: 30000,
                error: ({ responseText, status }, textStatus, error) => {
                    if (error === 'timeout') {
                        renderData(error, undefined, status, Date.now() - start);
                        return;
                    }
                    let errorData;
                    try {
                        errorData = JSON.parse(responseText);
                    } catch (e) {
                        error = 'Unknown error';
                    }
                    renderData(error, errorData, status, Date.now() - start);
                },
                success: (response, textStatus, { status }) => {
                    renderData(null, response, status, Date.now() - start);
                },
            });
        });
    };
    const formatParams = (params, response = false, hidden = false) => {
        if (!params) {
            return '';
        }
        const keys = Object.keys(params);
        if (!keys.length) {
            return '';
        }
        const $table = $(`<table class="table"${hidden ? ' style="display: none;"' : ''}><thead><tr><th>Field</th><th>Type</th><th>Description</th><th>${response ? '' : 'Required'}</th></tr></thead><tbody></tbody></table>`);
        const $tbody = $table.find('tbody');
        keys.forEach((key) => {
            const { description, type, required, shape, shape_array } = params[key];
            let typeCell = type;
            if (shape) {
                typeCell = `Shape <a href="#" class="shape-visibility">show</a>${formatParams(shape, response, true)}`;
            } else if (shape_array) {
                typeCell = `Shape[] <a href="#" class="shape-visibility">show</a>${formatParams(shape_array, response, true)}`;
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
    const renderResponse = (response, type) => {
        if (response === null) {
            return '<h5>No content response</h5>';
        }
        if (type.indexOf('application/json') >= 0) {
            return formatParams(response, true);
        }
        return `<h5>${type}</h5>`;
    };
    const formatDocs = (endpoint, { description, docs, params, response, response_type, required_auth, deprecated, args, errors, auth }) => {
        const id = getEndpointId(endpoint);
        const { origin, pathname, hash, search } = location;
        const link = `${origin}${pathname}${search}#${id}`;
        const $docs = $(`
            <div id='${id}' class="endpoint${deprecated ? ' deprecated' : ''}">
                <h3>${endpoint}</h3>
                <div class="docs">
                    <div>
                        ${deprecated ? '<span class="badge badge-danger">DEPRECATED</span>' : ''}
                        ${required_auth ? '<span class="badge badge-warning">REQUIRES AUTHORIZATION</span>' : ''}   
                        ${auth === 'OPTIONAL' ? '<span class="badge badge-secondary">OPTIONAL AUTHORIZATION</span>' : ''}  
                    </div>  
                    <div class="btn-group">
                        <a class="copy-link btn btn-outline-info" href="${link}">copy documentation link</a>     
                        <a class="copy-link btn btn-outline-info" href="${baseUrl}${endpoint.split(' ')[1]}">copy endpoint link</a>   
                        <a class="test-link btn btn-outline-info${response_type && response_type.indexOf('application/json') < 0 ? ' disabled' : ''}" href="#${id}">test in console</a>
                    </div>        
                    <p class="description card card-body bg-light">${description || docs || ''}</p>
                    <h4>Arguments</h4>
                    ${formatParams(args, true)}
                    <h4>Params</h4>
                    ${formatParams(params)}
                    <h4>Response</h4>
                    ${renderResponse(response, response_type)}
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
            testConsole(endpoint, { description, docs, params, response, required_auth, deprecated, args, auth });
            $console.show();
        });
        $docs.find('a.shape-visibility').click((e) => {
            e.preventDefault();
            const $this = $(e.target);
            const $table = $this.siblings('table');
            if ($table.is(':visible')) {
                $table.hide();
                $this.text('show');
            } else {
                $table.show();
                $this.text('hide');
            }
        });
        return $docs;
    };
    const renderIndexItems = ($parent, endpoints, showDeprecated = true, search = null) => {
        $parent.html('');
        search = search ? search.split(' ').map(item => item.toLowerCase()) : null;
        endpoints.forEach(({ endpoint, deprecated, required_auth }) => {
            if (!showDeprecated && deprecated) {
                return;
            }
            let valid = true;
            if (search) {
                search.forEach((text) => {
                    if (!valid) {
                        return;
                    }
                    if (endpoint.toLowerCase().indexOf(text) < 0) {
                        valid = false;
                    }
                });
            }
            if (!valid) {
                return;
            }
            $parent.append(`<a class="list-group-item${deprecated ? ' deprecated' : ''}${required_auth ? ' auth' : ''}" href="#${getEndpointId(endpoint)}" title="${endpoint}">${endpoint}</a>`);
        });
    };
    $.ajax({
        dataType: 'json',
        url: `${baseUrl}${DOCS_ROUTE}?api_key=${API_KEY}`,
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
                <h3 id="input">Input<a href="#input"></a></h3>
                <p>
                    HTTP methods <code>POST</code>, <code>PUT</code> and <code>DELETE</code> are using JSON body as input parameters. 
                    So header <code>Content-Type: application/json</code> is required.<br />
                    <code>GET</code> method is using query string for input parameters.
                </p>
                <h3 id="output">Output<a href="#output"></a></h3>
                <p>
                    The API is returning data in <code>JSON</code> string with <code>Content-Type: application/json</code> header if it's not defined otherwise.<br />
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
                <h3 id="types">Types<a href="#types"></a></h3>
                <p>
                    Arguments, params and response are using type definition. The casting of the type is defined in <a href="https://www.npmjs.com/package/runtime-type#types" target="_blank">here</a>.
                </p>
                ${API_KEY && API_KEY !== 'undefined' ? '<h3 href="#api-key">Api key<a href="#api-key"></a></h3><p>The key for access to the API. It is an GET parameter and for acquiring one please contact the API developer.</p>' : ''}
                <h3 id="authorization">Authorization<a href="#authorization"></a></h3>
                <p>
                Endpoints requiring the authorization must be called with <code>${AUTH_KEY}</code> header. Otherwise the error response will be returned.
                </p>
                ${AUTH_DESCRIPTION ? `<p>${AUTH_DESCRIPTION}</p>` : ''}
                <h3 id="reserved-get-params">Reserved GET parameters<a href="#reserved-get-params"></a></h3>
                <h4>nometa</h4>
                <p>Hides meta data from the response.</p>
                <h4>pretty</h4>
                <p>Prints the response for human reading.</p>
                <h2 id="endpoints">Endpoints<a href="#endpoints"></a></h2>
            `);
            $index.html(`
            <div class="form-check">
                <h2>Endpoints<span class="badge badge-info pull-right align-middle">${Object.keys(data).length}</span></h2>
                <p>
                    <label class="form-check-label" for="show-deprecated">
                        <input class="form-check-input" type="checkbox" checked id="show-deprecated" />Show deprecated
                    </label>
                </p>
                <p>
                    <label class="form-check-label" for="show-deprecated">
                        <input class="form-check-input w-100" type="text" id="index-search" placeholder="Search" />Search
                    </label>
                </p>
            </div>
            <div class="list-group list-group-flush"></div>`);
            const $ul = $index.find('div.list-group');
            const $showDeprecated = $index.find('#show-deprecated');
            const $search = $index.find('#index-search');
            const endpoints = [];
            Object.keys(data).forEach((endpoint) => {
                $content.append(formatDocs(endpoint, data[endpoint]));
                const { deprecated, required_auth } = data[endpoint];
                endpoints.push({ endpoint, deprecated, required_auth });
            });
            renderIndexItems($ul, endpoints, true);
            $showDeprecated.click(e => renderIndexItems($ul, endpoints, e.target.checked, $search.val()));
            $search.keyup(e => renderIndexItems($ul, endpoints, $showDeprecated.prop('checked'), e.target.value));
            if (location.hash) {
                location.href = location.hash;
            }
            window.onpopstate = () => {
                if (!consoleOpened) {
                    // return;
                }
                const { hash } = location;
                if (!hash) {
                    return;
                }
                Object.keys(data).forEach((endpoint) => {
                    if (hash.substr(1) === getEndpointId(endpoint)) {
                        testConsole(endpoint, data[endpoint]);
                        return;
                    }
                });
            }
        },
    });
});