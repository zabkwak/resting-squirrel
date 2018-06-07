$(document).ready(() => {
    const $content = $('#content');
    const formatParams = (params, response = false) => {
        $table = $(`<table class="table"><thead><tr><th>Name</th><th>Type</th><th>Description</th><th>${response ? '' : 'Required'}</th></tr></thead><tbody></tbody></table>`);
        $tbody = $table.find('tbody');
        Object.keys(params).forEach((key) => {
            const { description, type, required } = params[key];
            $tbody.append(`<tr><td>${key}</td><td>${type}</td><td>${description}</td><td>${response ? '' : required}</td></tr>`);
        });
        return $table.prop('outerHTML');
    };
    const formatDocs = (endpoint, { description, docs, params, response, required_auth, deprecated }) => {
        const id = endpoint.replace(/ |\//g, '-').replace(/\-+/g, '-').toLowerCase();
        const { origin, pathname, hash } = location;
        const link = `${origin}${pathname}#${id}`;
        const $docs = $(`
            <div id='${id}' class="endpoint${deprecated ? ' deprecated' : ''}">
                <h2>${endpoint}</h2>
                <div class="docs">
                    ${deprecated ? '<span class="badge badge-danger">DEPRECATED</span>' : ''}
                    ${required_auth ? '<span class="badge badge-warning">REQUIRES AUTHORIZATION</span>' : ''}
                    <a class="copy-link" href="#${id}">copy link</a>                    
                    <p class="description rounded">${description || docs}</p>
                    <h3>Params</h3>
                        <div class=".bootstrap-table">
                            ${formatParams(params)}
                        </div>
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
        $docs.find('h2').click(() => {
            $docsContent.toggle();
        });
        if (hash !== `#${id}`) {
            $docsContent.hide();
        }
        return $docs;
    };
    $.ajax({
        dataType: 'json',
        url: '/docs',
        success: ({ data, _meta }) => {
            $content.html('');
            Object.keys(data).forEach((endpoint) => {
                $content.append(formatDocs(endpoint, data[endpoint]));
            });
        },
    });
});