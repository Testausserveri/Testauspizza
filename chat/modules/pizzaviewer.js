const embeds = require('../embeds');
const utils = require('../utils');

function handle(state, msg, client, db) {
    embeds.product(state.temp.currentProduct.productID).then(result => {
        if (result === undefined) {
            msg.channel.send(utils.templates.error)
        } else {
            msg.channel.send(result.popularEmbed)
        }
    }).catch(err => {
        console.error(err);
        msg.channel.send(utils.templates.error);
    });
}

module.exports = {
    handle
}
