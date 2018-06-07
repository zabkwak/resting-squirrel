$(document).ready(() => {
    const $content = $('#content');
    const $index = $('#index');
    const getEndpointId = endpoint => endpoint.replace(/ |\//g, '-').replace(/\-+/g, '-').toLowerCase();
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
    const formatDocs = (endpoint, { description, docs, params, response, required_auth, deprecated }) => {
        const id = getEndpointId(endpoint);
        const { origin, pathname, hash } = location;
        const link = `${origin}${pathname}#${id}`;
        const $docs = $(`
            <div id='${id}' class="endpoint${deprecated ? ' deprecated' : ''}">
                <h2>${endpoint}</h2>
                <div class="docs">
                    <a class="copy-link" href="#${id}">copy link</a>     
                    ${deprecated ? '<span class="badge badge-danger">DEPRECATED</span>' : ''}
                    ${required_auth ? '<span class="badge badge-warning">REQUIRES AUTHORIZATION</span>' : ''}               
                    <p class="description rounded">${description || docs}</p>
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
            const $link = $(`<input class="link" type="text" value="${link}">`);
            $docs.append($link);
            $link[0].select();
            document.execCommand('copy');
            $link.remove();
        });
        return $docs;
    };
    $.ajax({
        dataType: 'json',
        url: '/docs',
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