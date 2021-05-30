const utils = require('../utils');
const embeds = require('../embeds');
const api = require('../../kotipizza/api');
const mapGen = require('osm-static-maps');
const nominatimApi = require('../../nominatim/api');

function startOrder(state, msg, client, db) {
    state.state = "ordering";
    state.deliveryType = undefined;
    state.contact = utils.defaultContact();
    state.hotspotId = -1;
    state.shop = undefined;
    msg.channel.startTyping();
    db.updateUser(msg.author.id, state).then(() => {
        msg.channel.stopTyping();
        msg.channel.send("  **Tilaus**  ");
        msg.channel.send(["->", utils.templates.orderingGuide].join(" "));
    }).catch(err => {
        msg.channel.stopTyping();
        console.error(err);
        msg.channel.send(utils.templates.error);
    });
}

function handleAfterDTypeSelection(state, msg, client, db) {
    if (state.deliveryType === utils.constants.deliveryTypes.delivery) {
        msg.channel.send(utils.templates.enterDeliveryAddress)
    } else {
        msg.channel.send(utils.templates.searchShop);
    }
}

function selectLocation(state, msg, client, db) {
    let split = msg.content.split(" ");
    if (split.length > 1) {
        let id = parseInt(split[1]);
        if (!isNaN(id)) {
            msg.channel.startTyping();
            api.getShopsWithOpenFlags([id]).then(shops => {
                if (shops.length === 0) {
                    msg.channel.send(utils.templates.locationNotFound);
                    msg.channel.stopTyping();
                    return;
                }
                state.shop = shops[0];
                state.timing = utils.constants.timings.now;
                db.updateUser(msg.author.id, state).then(() => {
                    msg.channel.stopTyping();
                    msg.channel.send(utils.templates.done);
                    msg.channel.send(utils.templates.contactInfo.name);
                }).catch(err => {
                    msg.channel.stopTyping();
                    console.error(err);
                    msg.channel.send(utils.templates.error);
                });
            }).catch(err => {
                msg.channel.stopTyping();
                console.error(err);
                msg.channel.send(utils.templates.error);
            });
            return;
        }
    }
    msg.channel.send(utils.templates.locationNotFound);
}

function inputWhileOrder(state, msg, client, db) {
    if (state.deliveryType === undefined) {
        msg.channel.startTyping();
        // Handle delivery type
        if (/.*kuljet.*/.test(msg.content.toLowerCase()))
            state.deliveryType = utils.constants.deliveryTypes.delivery;
        else if (/.*ravinto.*/.test(msg.content.toLowerCase()))
            state.deliveryType = utils.constants.deliveryTypes.eatInStore;
        else if (/.*nou(t|d).*/.test(msg.content.toLowerCase()))
            state.deliveryType = utils.constants.deliveryTypes.pickup;
        else {
            msg.channel.stopTyping();
            msg.channel.send(utils.templates.invalidDelType+", "+utils.templates.orderingGuide)
            return;
        }
        db.updateUser(msg.author.id, state).then(() => {
            msg.channel.send(utils.templates.done);
            handleAfterDTypeSelection(state, msg, client, db);
            msg.channel.stopTyping();
        }).catch(err => {
            console.error(err);
            msg.channel.stopTyping();
            msg.channel.send(utils.templates.error);
        });
    } else if (state.deliveryType === utils.constants.deliveryTypes.delivery && !state.contact.coordinates.longitude && !state.contact.coordinates.latitude) {
        let address = msg.content;
        let parts = address.split(",");
        if (parts.length < 3) {
            msg.channel.send(utils.templates.invalidAddressFormat);
            let fixTable = `Tarkista virheet:\n
               Osoite: ${parts[0] || '??'},
               Postinumero: ${parts[1] || '??'},
               Kaupunki: ${parts[2] || '??'},
            `;
            msg.channel.send(fixTable);
            return;
        }
        msg.channel.startTyping();
        nominatimApi.search(address).then(result => {
            if (result.length > 0) {
                let point = result[0];
                msg.channel.send(utils.templates.searching)
                let geoJson = {type: "Point", coordinates: [parseFloat(point.lon), parseFloat(point.lat)]};
                mapGen({geojson: geoJson, attribution: utils.templates.osmNote}).then(img => {
                    msg.channel.stopTyping();
                    state.contact.street = parts[0];
                    state.contact.postalCode = parts[1];
                    state.contact.city = parts[2];
                    state.contact.coordinates.longitude = geoJson.coordinates[0];
                    state.contact.coordinates.latitude = geoJson.coordinates[1];
                    db.updateUser(msg.author.id, state).then(() => {
                        msg.channel.send(`Sijainti valittu: **${point.display_name}**`, {files: [img]});
                        setTimeout(() => {
                            msg.channel.send(utils.templates.searchNearestShop);
                            api.getNearbyShops(state.deliveryType.toUpperCase(),geoJson.coordinates.reverse().join(",")).then(shops => {
                                msg.channel.stopTyping();
                                if (shops.length === 0) {
                                    msg.channel.send(utils.templates.noPickupLocationForDelivery)
                                    return;
                                }
                                shops.forEach(shop => {
                                    msg.channel.send(embeds.shopEmbed(shop, state.deliveryType));
                                });
                                msg.channel.send(utils.templates.selectLocation);
                            }).catch(err => {
                                msg.channel.stopTyping();
                                console.error(err);
                                msg.channel.send(utils.templates.error);
                            });
                        }, 500);
                    }).catch(err => {
                        msg.channel.stopTyping();
                        console.error(err);
                        msg.channel.send(utils.templates.error);
                    });
                }).catch(err => {
                    msg.channel.stopTyping();
                    console.error(err);
                    msg.channel.send(utils.templates.error);
                });
            } else {
                msg.channel.stopTyping();
                msg.channel.send(utils.templates.locationNotFound);
            }
        }).catch(err => {
            msg.channel.stopTyping();
            console.error(err);
            msg.channel.send(utils.templates.error);
        });
    } else if (!state.shop && state.deliveryType !== utils.constants.deliveryTypes.delivery) {
        let query = msg.content;
        if (query.length >= 3) {
            msg.channel.send(utils.templates.searching)
            msg.channel.startTyping();
            api.search(query).then(results => {
                if (results.restaurants.results.length > 0) {
                    api.getShopsWithOpenFlags(results.restaurants.results.map(item => {return item.shopId})).then(shops => {
                        msg.channel.stopTyping();
                        shops.forEach(shop => {
                            msg.channel.send(embeds.shopEmbed(shop, state.deliveryType));
                        });
                        msg.channel.send(utils.templates.selectLocation);
                    }).catch(err => {
                        msg.channel.stopTyping();
                        console.error(err);
                        msg.channel.send(utils.templates.error);
                    });
                    return;
                }
                msg.channel.send(utils.templates.locationNotFound);
            }).catch(err => {
                console.error(err);
                msg.channel.stopTyping();
                msg.channel.send(utils.templates.error);
            });
            return;
        }
        msg.channel.send(utils.templates.invalidQuery);
    } else if (!state.timing) {
        if (/.*heti|nyt.*/.test(msg.content.toLowerCase())) {
            state.timing = utils.constants.timings.now;
            msg.channel.send(utils.templates.done);
        } else if (/.*ennak.*/.test(msg.content.toLowerCase())) {
            state.timing = utils.constants.timings.ennakkotilaus;
            msg.channel.send(utils.templates.done);

        } else {
            msg.channel.send(utils.templates.delOptions)
        }
    } else if (state.timing !== utils.constants.timings.now) {
        // TODO
    } else {
        if (!state.contact.firstName) {
            state.contact.firstName = msg.content;
            msg.channel.send(utils.templates.contactInfo.surname);
        } else if (!state.contact.lastName) {
            state.contact.lastName = msg.content;
            msg.channel.send(utils.templates.contactInfo.email);
        } else if (!state.contact.email) {
            state.contact.email = msg.content;
            msg.channel.send(utils.templates.contactInfo.phone);
        } else if (!state.contact.phoneNumber) {
            state.contact.phoneNumber = msg.content;
            msg.channel.send(utils.templates.done);
            let orderBody = utils.convertStateToOrderBody(state);
            api.makeOrder(orderBody).then(result => {
                if (result.orderOK) {
                    state.order = result;
                    msg.channel.send(utils.templates.orderNeedsPayment)
                    msg.channel.send("Maksettavaa yhteensä. "+result.grandTotal+"€")
                    embeds.paymentMethodsEmbed(result).forEach(item => {
                        setTimeout(() => {msg.channel.send(item)}, 600);
                    })
                    db.updateUser(msg.author.id, utils.defaultState()).then(() => {}).catch(err => {
                        console.error(err);
                        msg.channel.send(utils.templates.error);
                    });
                } else {
                    console.error(result);
                    msg.channel.send(utils.templates.error);
                }
            }).catch(err => {
                console.error(err);
                msg.channel.send(utils.templates.error);
            });
            return;
        } else {
            let orderBody = utils.convertStateToOrderBody(state);
            api.makeOrder(orderBody).then(result => {
                if (result.orderOK) {
                    state.order = result;
                    msg.channel.send(utils.templates.orderNeedsPayment)
                    msg.channel.send("Maksettavaa yhteensä. "+result.grandTotal+"€")
                    embeds.paymentMethodsEmbed(result).forEach(item => {
                        setTimeout(() => {msg.channel.send(item)}, 600);

                    })
                    db.updateUser(msg.author.id, utils.defaultState()).then(() => {}).catch(err => {
                        console.error(err);
                        msg.channel.send(utils.templates.error);
                    });
                } else {
                    console.error(result);
                    msg.channel.send(utils.templates.error);
                }
            }).catch(err => {
                console.error(err);
                msg.channel.send(utils.templates.error);
            });
            return;
        }
        db.updateUser(msg.author.id, state).then(() => {
        }).catch(err => {
            msg.channel.stopTyping();
            console.error(err);
            msg.channel.send(utils.templates.error);
        });
    }
}

module.exports = {
    startOrder, inputWhileOrder, selectLocation
}