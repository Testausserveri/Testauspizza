const utils = require('../utils');
const embeds = require('../embeds');
const commonEmbeds = require('../embeds/common');
const api = require('../../kotipizza/api');
const mapGen = require('osm-static-maps');
const nominatimApi = require('../../nominatim/api');
const {MessageActionRow, MessageSelectMenu, MessageButton} = require("discord.js");

function startOrder(state, interaction, db) {
    state.state = "ordering";
    state.deliveryType = undefined;
    state.contact = utils.defaultContact();
    state.hotspotId = -1;
    state.shop = undefined;
    db.updateUser(interaction.user.id, state).then(() => {
        interaction.reply(commonEmbeds.startOrderWithOptions);
    }).catch(err => {
        console.error(err);
    });
}

function afterDeliveryTypeSelection(state, interaction) {
    if (state.deliveryType === utils.constants.deliveryTypes.delivery) {
        interaction.reply(utils.templates.enterDeliveryAddress)
    } else {
        interaction.reply(utils.templates.searchShop);
    }
}

function selectLocation(id, state, interaction, db) {
    id = parseInt(id);
    if (!isNaN(id)) {
        api.getShopsWithOpenFlags([id]).then(shops => {
            if (shops.length === 0) {
                interaction.reply(utils.templates.locationNotFound);
                return;
            }
            state.shop = shops[0];
            state.timing = utils.constants.timings.now;
            db.updateUser(interaction.user.id, state).then(() => {
                interaction.reply(utils.templates.contactInfo.name);
            }).catch(err => {
                console.error(err);
            });
        }).catch(err => {
            console.error(err);
        });
        return;
    }
    interaction.reply(utils.templates.locationNotFound);
}

async function sendPaymentButton(state, interaction, db) {
    if (!interaction.values)
        return;
    let id = interaction.values[0];
    let paymentMethods = embeds.paymentMethodURLs(state.order);
    let filtered = paymentMethods.filter(i => i.id === id);
    if (filtered.length === 1) {
        let method = filtered[0];
        if (method.category === utils.constants.paymentGroups.onsite) {
            // If payment method is internal (ie. COD or OnSite), make the request here
            // and send redirect URL from result
            let newRedirectUrl = await api.internalPaymentRedirect(method.url);
            if (newRedirectUrl && newRedirectUrl.redirectUrl)
                method.url = newRedirectUrl.redirectUrl;
        }
        if (method.url.length > 512) {
            interaction.reply({content: [utils.templates.paymentMethod+" "+method.name, method.url].join("\n")})
        } else {
            interaction.reply({content: utils.templates.paymentMethod, components: [
                    new MessageActionRow()
                        .addComponents(
                            new MessageButton()
                                .setURL(method.url)
                                .setLabel(method.name)
                                .setStyle('LINK'),
                        )
                ]});
        }

        db.updateUser(interaction.user.id, utils.defaultState()).then(() => {}).catch(err => {
            console.error(err);
        })
    }
}


function inputWhileOrder(state, msg, client, db) {
    if (state.deliveryType === utils.constants.deliveryTypes.delivery && !state.contact.coordinates.longitude && !state.contact.coordinates.latitude) {
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
        msg.channel.sendTyping();
        nominatimApi.search(address).then(result => {
            if (result.length > 0) {
                let point = result[0];
                msg.channel.send(utils.templates.searching)
                let geoJson = {type: "Point", coordinates: [parseFloat(point.lon), parseFloat(point.lat)]};
                mapGen({geojson: geoJson, attribution: utils.templates.osmNote}).then(img => {
                    state.contact.street = parts[0];
                    state.contact.postalCode = parts[1];
                    state.contact.city = parts[2];
                    state.contact.coordinates.longitude = geoJson.coordinates[0];
                    state.contact.coordinates.latitude = geoJson.coordinates[1];
                    db.updateUser(msg.author.id, state).then(() => {
                        msg.channel.send({content: `Sijainti valittu: **${point.display_name}**`, files: [img]});
                        setTimeout(() => {
                            msg.channel.send(utils.templates.searchNearestShop);
                            api.getNearbyShops(state.deliveryType.toUpperCase(),geoJson.coordinates.reverse().join(",")).then(shops => {
                                // Filter shops only available for delivery
                                shops.filter(shop => {return shop['openFor'+utils.capitalizeFirstLetter(state.deliveryType.toLowerCase())+"Status"] && shop['openFor'+utils.capitalizeFirstLetter(state.deliveryType.toLowerCase())+"Status"] === "OPEN"});
                                if (shops.length === 0) {
                                    msg.channel.send(utils.templates.noPickupLocationForDelivery)
                                    return;
                                }
                                let selectableItems = [];
                                shops.forEach(shop => {
                                    selectableItems.push({label: shop.displayName.substr(0, 99), description: [shop.streetAddress, shop.zipCode, shop.city].join(", ").substr(0, 99), value: shop.restaurantId.toString()})
                                });
                                const row = new MessageActionRow()
                                    .addComponents(
                                        new MessageSelectMenu()
                                            .setCustomId('selectStore')
                                            .setPlaceholder('Valise')
                                            .addOptions(selectableItems),
                                    );
                                if (selectableItems.length > 0)
                                    msg.channel.send({content: utils.templates.selectLocation, components: [row]});
                            }).catch(err => {
                                console.error(err);
                                msg.channel.send(utils.templates.error);
                            });
                        }, 500);
                    }).catch(err => {
                        console.error(err);
                        msg.channel.send(utils.templates.error);
                    });
                }).catch(err => {
                    console.error(err);
                    msg.channel.send(utils.templates.error);
                });
            } else {
                msg.channel.send(utils.templates.locationNotFound);
            }
        }).catch(err => {
            console.error(err);
            msg.channel.send(utils.templates.error);
        });
    } else if (!state.shop && state.deliveryType !== utils.constants.deliveryTypes.delivery) {
        let query = msg.content;
        if (query.length >= 3) {
            msg.channel.send(utils.templates.searching)
            msg.channel.sendTyping();
            api.search(query).then(results => {
                if (results.restaurants.results.length > 0) {
                    api.getShopsWithOpenFlags(results.restaurants.results.map(item => {return item.shopId})).then(shops => {
                        let selectableItems = [];
                        // Filter shops only available for delivery
                        shops.filter(shop => {return shop['openFor'+utils.capitalizeFirstLetter(state.deliveryType.toLowerCase())+"Status"] && shop['openFor'+utils.capitalizeFirstLetter(state.deliveryType.toLowerCase())+"Status"] === "OPEN"});
                        shops.splice(0, 25).forEach(shop => {
                            selectableItems.push({label: shop.displayName.substr(0, 99), description: [shop.streetAddress, shop.zipCode, shop.city].join(", ").substr(0, 99), value: shop.restaurantId.toString()})
                        });
                        const row = new MessageActionRow()
                            .addComponents(
                                new MessageSelectMenu()
                                    .setCustomId('selectStore')
                                    .setPlaceholder('Valise')
                                    .addOptions(selectableItems),
                            );
                        if (selectableItems.length > 0)
                            msg.channel.send({content: utils.templates.selectLocation, components: [row]});
                        else
                            msg.channel.send(utils.templates.noPointsAvailable)
                    }).catch(err => {
                        console.error(err);
                        msg.channel.send(utils.templates.error);
                    });
                    return;
                }
                msg.channel.send(utils.templates.locationNotFound);
            }).catch(err => {
                console.error(err);
                msg.channel.send(utils.templates.error);
            });
            return;
        }
        msg.channel.send(utils.templates.invalidQuery);
    } else if (!state.timing) {
        state.timing = utils.constants.timings.now;
        db.updateUser(msg.author.id, state).then(() => {
        }).catch(err => {
            console.error(err);
            msg.channel.send(utils.templates.error);
        });
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
                    msg.channel.send("Maksettavaa yhteens??. "+result.grandTotal+"???")
                    let paymentMethods = embeds.paymentMethodURLs(result).map(i => {return {label: i.name, description: i.category, value: i.id.toString()}});
                    const row = new MessageActionRow()
                        .addComponents(
                            new MessageSelectMenu()
                                .setCustomId('selectPaymentMethod')
                                .setPlaceholder('Valise')
                                .addOptions(paymentMethods),
                        );
                    msg.channel.send({content: utils.templates.orderNeedsPayment, components: [row]})
                    db.updateUser(msg.author.id, state).then(() => {}).catch(err => {
                        console.error(err);
                        msg.channel.send(utils.templates.error);
                    })
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
                    msg.channel.send("Maksettavaa yhteens??. "+result.grandTotal+"???")
                    let paymentMethods = embeds.paymentMethodURLs(result).map(i => {return {label: i.name, description: i.category, value: i.id.toString()}});
                    const row = new MessageActionRow()
                        .addComponents(
                            new MessageSelectMenu()
                                .setCustomId('selectPaymentMethod')
                                .setPlaceholder('Valise')
                                .addOptions(paymentMethods),
                        );
                    msg.channel.send({content: utils.templates.orderNeedsPayment, components: [row]})
                    db.updateUser(msg.author.id, state).then(() => {}).catch(err => {
                        console.error(err);
                        msg.channel.send(utils.templates.error);
                    })
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
        if (!state.order) {
            db.updateUser(msg.author.id, state).then(() => {
            }).catch(err => {
                console.error(err);
                msg.channel.send(utils.templates.error);
            });
        }
    }
}

module.exports = {
    startOrder, inputWhileOrder, selectLocation, afterDeliveryTypeSelection, sendPaymentButton
}