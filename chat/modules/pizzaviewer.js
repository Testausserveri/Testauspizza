const productEmbeds = require('../embeds/product');
const utils = require('../utils');

function handle(state, interaction, db) {
    productEmbeds.product(state.temp.currentProduct.productID, state, interaction, db).then(result => {
        if (result === undefined) {
            interaction.reply(utils.templates.error)
        } else {
            interaction.reply(result.popularEmbed)
        }
    }).catch(err => {
        console.error(err);
        interaction.reply(utils.templates.error);
    });
}

module.exports = {
    handle
}
