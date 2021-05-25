const embeds = require('../embeds');
const utils = require('../utils');

function handle(state, msg, client, db) {
    embeds.popularProducts().then(embed => {
        msg.channel.send(embed);
    }).catch(err => {
        console.error(err);
        msg.channel.send(utils.templates.error);
    })
}

module.exports = {
    handle
}
