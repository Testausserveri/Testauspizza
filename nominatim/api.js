const http = require('../kotipizza/httpclient');

function search(query) {
    return new Promise((resolve, reject) => {
        http.get(global.config.nominatimBackendUrl+`search.php?q=${encodeURIComponent(query)}&format=jsonv2&accept_language=fi`, res => {
            if (res.statusCode === 200) {
                resolve(res.body);
            } else {
                reject("Response code "+res.statusCode);
            }
        }, err => {
            reject(err);
        })
    })
}


module.exports = {
    search
}