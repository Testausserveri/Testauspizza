const embeds = require('../embeds');
const utils = require('../utils');
const api = require('../../kotipizza/api');

function list(state, msg, client, db) {
    embeds.selectedIngredients(state.temp.ingredients).then(embed => {
        msg.channel.send(embed);
    }).catch(err => {
        console.error(err);
        msg.channel.send(utils.templates.error);
    });
}

function remove(state, msg, client, db) {
    let split = msg.content.split(" ");
    if (split.length > 1) {
        let id = parseInt(split[1]);
        if (!isNaN(id)) {
            let filteredList = state.temp.ingredients.filter(item => {return item.id === id});
            if (filteredList.length === 1) {
                state.temp.ingredients = state.temp.ingredients.filter(item => {
                    return item.id !== id
                });
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
    msg.channel.send(utils.templates.ingredientNotFound);
}

function add(state, msg, client, db) {
    let split = msg.content.split(" ");
    if (split.length > 1) {
        let id = parseInt(split[1]);
        if (!isNaN(id)) {
            api.getIngredient(id).then(ingredient => {
                if (ingredient === undefined || !ingredient.isActive) {
                    msg.channel.send(utils.templates.ingredientNotFound);
                    return;
                }
                let ingredientDosing = ingredient.ingredientdosings.filter(item => {return item.productSizeID === state.temp.currentSize.productSizeID && item.active});
                if (ingredientDosing.length > 0) {
                    let dosing = ingredientDosing[0];
                    state.temp.ingredients.push({id: ingredient.ingredientID, dosingId: dosing.dosingID});
                    db.updateUser(msg.author.id, state).then(() => {
                        msg.channel.send(utils.templates.done);
                    }).catch(err => {
                        console.error(err);
                        msg.channel.send(utils.templates.error);
                    })
                } else {
                    msg.channel.send(utils.templates.ingredientNotFound);
                }
            }).catch(err => {
                console.error(err);
                msg.channel.send(utils.templates.error);
            });
            return;
        }
    }
    msg.channel.send(utils.templates.ingredientNotFound);
}

function search(state, msg, client, db) {
    let split = msg.content.split(" ");
    if (split.length > 2 && !isNaN(parseInt(split[2]))) {
        // Filter with category
        let category = parseInt(split[2]);
        let query = split[1];
        if (query.length >= 3) {
            api.search(query).then(searchResults => {
                if (searchResults.ingredients) {
                    console.log(category);
                    searchResults.ingredients.results = searchResults.ingredients.results.filter(item => {return item.ingredientCategoryID === category});
                    if (searchResults.ingredients.results.length > 0) {
                        embeds.ingredients(searchResults.ingredients.results.splice(0, 15), state.temp.currentSize).then(embed => {
                            if (embed === undefined) {
                                msg.channel.send(utils.templates.searchNotFound);
                                return;
                            }
                            msg.channel.send(embed);
                        }).catch(err => {
                            console.error(err);
                            msg.channel.send(utils.templates.error);
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
    } else if (split.length > 1) {
        let query = split[1];
        if (query.length >= 3) {
            api.search(query).then(searchResults => {
                if (searchResults.ingredients) {
                    console.log(searchResults.ingredients.results.length);
                    if (searchResults.ingredients.results.length > 0) {
                        embeds.ingredients(searchResults.ingredients.results.splice(0, 15), state.temp.currentSize).then(embed => {
                            if (embed === undefined) {
                                msg.channel.send(utils.templates.searchNotFound);
                                return;
                            }
                            msg.channel.send(embed);
                        }).catch(err => {
                            console.error(err);
                            msg.channel.send(utils.templates.error);
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

function categories(state, msg, client, db) {
    api.getIngredientCategories().then(categories => {
        msg.channel.send(embeds.ingredientCategories(categories));
    }).catch(err => {
        console.error(err);
        msg.channel.send(utils.templates.error);
    });
}

module.exports = {
    categories,
    search,
    add,
    remove,
    list
}