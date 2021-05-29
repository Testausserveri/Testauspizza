const utils = require('../utils');
const embeds = require('../embeds');
const api = require('../../kotipizza/api');
const {AsyncIterator} = require("../../utils/iterator");

function search(state, msg, client, db) {
    let split = msg.content.split(" ");
    if (split.length > 1) {
        let query = split[1];
        if (query.length >= 3) {
            msg.channel.startTyping();
            api.search(query).then(searchResults => {
                if (searchResults.products) {
                    if (searchResults.products.results.length > 0) {
                        searchResults.products.results.splice(0, 10).forEach(item => {
                            embeds.product(item.productID, true).then(embed => {
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
                msg.channel.stopTyping();
            }).catch(err => {
                msg.channel.stopTyping();
                console.error(err);
                msg.channel.send(utils.templates.error);
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
            msg.channel.startTyping();
            embeds.product(id).then(result => {
                msg.channel.stopTyping();
                if (result !== undefined) {
                    state.temp = utils.defaultTemp();
                    state.temp.currentProduct = result.product;
                    msg.channel.startTyping();
                    db.updateUser(msg.author.id, state).then(() => {
                        msg.channel.stopTyping();
                        msg.channel.send(result.popularEmbed);
                        msg.channel.send("Tuote on valittu. Valitse pizzan koko komennolla `!size <numero>` tai peru valinta komennolla `!deselect`")
                    }).catch(err => {
                        msg.channel.stopTyping();
                        console.error(err);
                        msg.channel.send(utils.templates.error);
                    })
                } else
                    msg.channel.send(utils.templates.productNotFound);
            }).catch(err => {
                msg.channel.stopTyping();
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
    let iterator = new AsyncIterator(undefined, undefined, state.orderItems);
    let total = 0;
    msg.channel.startTyping();
    iterator.callback = (item, index) => {
        embeds.addedProduct(item, index).then(embed => {
            msg.channel.send(embed.embed);
            total += embed.price;
            iterator.nextItem();
        }).catch(err => {
            msg.channel.stopTyping();
            console.error(err);
            msg.channel.send(utils.templates.error);
        })
    }
    iterator.endCallback = () => {
        msg.channel.send("Yhteensä: **"+total+"€**\n\n")
        msg.channel.send('_'+utils.templates.cartCommands+'_')
        msg.channel.stopTyping();
    }
    iterator.nextItem();
}

function remove(state, msg, client, db) {
    let split = msg.content.split(" ");
    if (split.length > 1) {
        let id = parseInt(split[1]);
        if (!isNaN(id)) {
            id = id-1;
            if (typeof state.orderItems[id] !== 'undefined') {
                state.orderItems.splice(id, 1);
                db.updateUser(msg.author.id, state).then(() => {
                    msg.channel.send(utils.templates.done);
                }).catch(err => {
                    console.error(err);
                    msg.channel.send(utils.templates.error);
                })
                return;
            }
        }
    }
    msg.channel.send(utils.templates.productNotFound);
}

module.exports = {
    search,
    select,
    deselect,
    add,
    list,
    remove
}