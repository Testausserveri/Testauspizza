const embeds = require('../embeds');
const utils = require('../utils');

function handle(state, msg, client, db) {
    let split = msg.content.split(" ");
    if (split.length > 1) {
        let id = parseInt(split[1]);
        if (!isNaN(id)) {
            embeds.product(state.temp.currentProduct.productID).then(result => {
                if (result === undefined) {
                    msg.channel.send(utils.templates.error)
                } else {
                    result = result.product;
                    let sizes = result.productSizes.filter(size => {return size.productSizeID === id;});
                    if (sizes.length > 0) {
                        state.temp.currentSize = sizes[0];
                        state.temp.ingredients = [...state.temp.currentSize.ingredients]
                        db.updateUser(msg.author.id, state).then(() => {
                            msg.channel.send(utils.templates.done);
                            embeds.selectedIngredients(state.temp.ingredients).then(embed => {
                                msg.channel.send(embed);
                                msg.channel.send(utils.templates.welcomingIngredientCommands);
                            }).catch(err => {
                                console.error(err);
                                msg.channel.send(utils.templates.error);
                            });
                        }).catch(err => {
                            console.error(err);
                            msg.channel.send(utils.templates.error);
                        })
                    } else {
                        msg.channel.send(utils.templates.sizeNotFound);
                    }
                }
            }).catch(err => {
                console.error(err);
                msg.channel.send(utils.templates.error);
            });
            return;
        }
    }
    msg.channel.send(utils.templates.sizeNotFound);
}

module.exports = {
    handle
}