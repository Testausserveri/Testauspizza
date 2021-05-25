const utils = require('../utils');
const embeds = require('../embeds');
const api = require('../../kotipizza/api');

function search(state, msg, client, db) {
    let split = msg.content.split(" ");
    if (split.length > 1) {
        let query = split[1];
        if (query.length >= 3) {
            api.search(query).then(searchResults => {
                if (searchResults.products) {
                    if (searchResults.products.results.length > 0) {
                        searchResults.products.results.splice(0, 10).forEach(item => {
                            embeds.product(item.productID).then(embed => {
                                if (embed === undefined) {
                                    msg.channel.send(utils.templates.error);
                                    return;
                                }
                                msg.channel.send(embed.popularEmbed);
                            })
                        });
                    } else {
                        msg.channel.send(utils.templates.searchNotFound);
                    }
                } else {
                    msg.channel.send(utils.templates.error);
                }
            });
            return;
        }
    }
    msg.channel.send(utils.templates.invalidQuery);
}

function select(state, msg, client, db) {
    let split = msg.content.split(" ");
    if (split.length > 1) {
        let id = parseInt(split[1]);
        if (!isNaN(id)) {
            embeds.product(id).then(result => {
                if (result !== undefined) {
                    state.temp = utils.defaultTemp();
                    state.temp.currentProduct = result.product;
                    db.updateUser(msg.author.id, state).then(() => {
                        msg.channel.send(result.popularEmbed);
                        msg.channel.send("Tuote on valittu. Valitse pizzan koko komennolla `!size <numero>` tai peru valinta komennolla `!deselect`")
                    }).catch(err => {
                        console.error(err);
                        msg.channel.send(utils.templates.error);
                    })
                } else
                    msg.channel.send(utils.templates.productNotFound);
            }).catch(err => {
                console.error(err);
                msg.channel.send(utils.templates.error);
            })
            return;
        }
    }
    msg.channel.send(utils.templates.productNotFound);
}

function deselect(state, msg, client, db) {
    if (state.temp.currentProduct !== undefined) {
        state.temp.currentProduct = undefined;
        state.temp.currentSize = undefined
        db.updateUser(msg.author.id, state).then(() => {
            msg.channel.send(utils.templates.done);
        }).catch(err => {
            console.error(err);
            msg.channel.send(utils.templates.error);
        })
    } else {
        msg.channel.send(utils.templates.noProductSelected)
    }
}

function add(state, msg, client, db) {
    if (state.temp.currentProduct !== undefined && state.temp.currentSize !== undefined) {
        state.orderItems.push({product: state.temp.currentProduct, size: state.temp.currentSize, ingredients: state.temp.ingredients});
        state.temp = utils.defaultTemp();
        db.updateUser(msg.author.id, state).then(() => {
            msg.channel.send(utils.templates.done);
            msg.channel.send(utils.templates.continueShopping);
        }).catch(err => {
            console.error(err);
            msg.channel.send(utils.templates.error);
        })
    } else if (!state.temp.currentProduct) {
        msg.channel.send(utils.templates.noProductSelected)
    } else if (!state.temp.currentSize) {
        msg.channel.send(utils.templates.noSizeSelected)
    }
}

function list(state, msg, client, db) {
    msg.channel.send("**Tuotteet:**");
    if (state.orderItems.length === 0) {
        msg.channel.send(utils.templates.sessionCommands);
    }
    state.orderItems.forEach(item => {
        embeds.addedProduct(item).then(embed => {
            msg.channel.send(embed);
        })
    })
}

module.exports = {
    search,
    select,
    deselect,
    add,
    list
}