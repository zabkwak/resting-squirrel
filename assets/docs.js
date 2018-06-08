$(document).ready(() => {
    const $content = $('#content');
    const $index = $('#index');
    const $console = $('#console');
    const getEndpointId = endpoint => endpoint.replace(/ |\//g, '-').replace(/\-+/g, '-').toLowerCase();
    const testConsole = (endpoint, { description, docs, args, params, response, required_auth, deprecated }) => {
        const [method, path] = endpoint.split(' ');
        const $consoleContent = $(`
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

        $('#console-form').submit((e) => {
            e.preventDefault();
            $response.html('Processing');
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
                url,
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
        $table = $(`<table class="table"><thead><tr><th>Field</th><th>Type</th><th>Description</th><th>${response ? '' : 'Required'}</th></tr></thead><tbody></tbody></table>`);
        $tbody = $table.find('tbody');
        keys.forEach((key) => {
            const { description, type, required } = params[key];
            $tbody.append(`<tr><td>${key}</td><td>${type}</td><td>${description}</td><td>${response ? '' : required}</td></tr>`);
        });
        return $table.prop('outerHTML');
    };
    const formatDocs = (endpoint, { description, docs, params, response, required_auth, deprecated, args }) => {
        const id = getEndpointId(endpoint);
        const { origin, pathname, hash } = location;
        const link = `${origin}${pathname}#${id}`;
        const $docs = $(`
            <div id='${id}' class="endpoint${deprecated ? ' deprecated' : ''}">
                <h2>${endpoint}</h2>
                <div class="docs">
                    <div>
                        ${deprecated ? '<span class="badge badge-danger">DEPRECATED</span>' : ''}
                        ${required_auth ? '<span class="badge badge-warning">REQUIRES AUTHORIZATION</span>' : ''}     
                    </div>  
                    <div>
                        <a class="copy-link btn btn-info" href="#${id}">copy link</a>     
                        <a class="test-link btn btn-info" href="#${id}">test in console</a>
                    </div>        
                    <p class="description rounded">${description || docs}</p>
                    <h3>Arguments</h3>
                    ${formatParams(args, true)}
                    <h3>Params</h3>
                    ${formatParams(params)}
                    <h3>Response</h3>
                    ${formatParams(response, true)}
                </div>
            </div>
        `);
        const $docsContent = $docs.find('.docs');
        $docs.find('a.copy-link').click((e) => {
            e.preventDefault();
            const $link = $(`<input class="link" type="text" value="${link}" />`);
            $docs.append($link);
            $link[0].select();
            document.execCommand('copy');
            $link.remove();
        });
        $docs.find('a.test-link').click((e) => {
            e.preventDefault();
            testConsole(endpoint, { description, docs, params, response, required_auth, deprecated, args });
        });
        return $docs;
    };
    $.ajax({
        dataType: 'json',
        url: '/docs',
        headers: { 'x-agent': 'Docs' },
        success: ({ data, _meta }) => {
            $content.html('');
            $index.html('<div class="list-group list-group-flush"></div>');
            $ul = $index.find('div.list-group');
            Object.keys(data).forEach((endpoint) => {
                $content.append(formatDocs(endpoint, data[endpoint]));
                $ul.append(`<a class="list-group-item" href="#${getEndpointId(endpoint)}">${endpoint}</a>`);
            });
        },
    });
});