const utils = require('../utils');
const embeds = require('../embeds');
const api = require('../../kotipizza/api');
const mapGen = require('osm-static-maps');
const nominatimApi = require('../../nominatim/api');

function startOrder(state, msg, client, db) {
    if (state.state !== "ordering") {
        state.state = "ordering";
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
}

function handleAfterDTypeSelection(state, msg, client, db) {
    if (state.deliveryType === utils.constants.deliveryTypes.delivery) {
        msg.channel.send(utils.templates.enterDeliveryAddress)
    } else {
        msg.channel.send(utils.templates.searchShop);
    }
}

function selectLocation() {

}

function inputWhileOrder(state, msg, client, db) {
    if (state.deliveryType === undefined) {
        msg.channel.startTyping();
        // Handle delivery type
        if (/.*kuljet.*/.exec(msg.content.toLowerCase()) !== undefined)
            state.deliveryType = utils.constants.deliveryTypes.delivery;
        else if (/.*ravinto.*/.exec(msg.content.toLowerCase()) !== undefined)
            state.deliveryType = utils.constants.deliveryTypes.eatInStore;
        else if (/.*nou(t|d).*/.exec(msg.content.toLowerCase()) !== undefined)
            state.deliveryType = utils.constants.deliveryTypes.pickup;
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
                                shops.forEach(shop => {
                                    msg.channel.send(embeds.shopEmbed(shop, state.deliveryType));
                                });
                                msg.channel.send('Valitse ravintola komennolla `!location <numero>` tai kirjoita hakusana hakeaksesi ravintolaa.');
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
    } else if (!state.shop) {
        // TODO search
    }
}

module.exports = {
    startOrder, inputWhileOrder
}