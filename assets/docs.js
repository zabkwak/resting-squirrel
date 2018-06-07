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
        const $docs = $(`
            <div class="endpoint">
                <h2>${deprecated ? `<del>${endpoint}</del>` : endpoint}</h2>
                <div class="docs">
                    ${deprecated ? '<span class="badge badge-danger">DEPRECATED</span>' : ''}
                    ${required_auth ? '<span class="badge badge-warning">REQUIRES AUTHORIZATION</span>' : ''}
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
        $docs.find('h2').click(() => {
            $docsContent.toggle();
        });
        $docsContent.hide();
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