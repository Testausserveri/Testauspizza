const embeds = require('../embeds');
const utils = require('../utils');

function handle(state, msg, client, db) {
    msg.channel.startTyping();
    embeds.popularProducts().then(embed => {
        msg.channel.send(embed);
        msg.channel.stopTyping();
    }).catch(err => {
        msg.channel.stopTyping();
        console.error(err);
        msg.channel.send(utils.templates.error);
    })
}

module.exports = {
    handle
}
