const utils = require('../utils');
const api = require('../../kotipizza/api');
const {showIngredientsCard} = require("../embeds/ingredients");

function handle(state, interaction, db) {
    let split = interaction.values;
    let id = parseInt(split[0]);
    console.log(id);
    if (!isNaN(id)) {
        api.getProduct(state.temp.currentProduct.productID).then(result => {
            if (result === undefined) {
                interaction.reply(utils.templates.error)
            } else {
                console.log(result);
                let sizes = result.productSizes.filter(size => {return size.productSizeID === id;});
                if (sizes.length > 0) {
                    state.temp.currentSize = sizes[0];
                    state.temp.ingredients = [...state.temp.currentSize.ingredients]
                    db.updateUser(interaction.user.id, state).then(() => {
                        showIngredientsCard(state, interaction)
                    }).catch(err => {
                        console.error(err);
                    })
                }
            }
        }).catch(err => {
            console.error(err);
        });
    }
}

module.exports = {
    handle
}