let needle = require('needle');

const config = {
    json: true,
    headers: {
        'User-Agent': 'Testauspizza/1.1'
    }
}

function post(url, data, response, error) {
    needle.post(url, data, {json: true, headers: {...config.headers, AuthToken: global.config.apiKey}}, function (err, resp) {
        if (err) {
            error(err);
            return;
        }
        response(resp);
    });
}

function deleteRequest(url, data, response, error) {
    needle.delete(url, data, config, function (err, resp) {
        if (err) {
            error(err);
            return;
        }
        response(resp);
    });

}

function get(url, response, error) {
    needle.get(url, config, function (err, resp) {
        if (err) {
            error(err);
            return;
        }
        response(resp);
    });
}

module.exports = {
    get: get,
    post: post,
    deleteRequest
}