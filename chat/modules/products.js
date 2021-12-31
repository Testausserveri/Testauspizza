const utils = require('../utils');
const productEmbeds = require('../embeds/product');
const api = require('../../kotipizza/api');
const {AsyncIterator} = require("../../utils/iterator");
const {MessageActionRow, MessageButton, CommandInteraction, MessageSelectMenu} = require("discord.js");

/**
 *
 * @param state
 * @param interaction {CommandInteraction}
 * @param db
 */
function search(state, interaction, db) {
    let query = interaction.options.getString('hakusana');
    if (query.length >= 3) {
        api.search(query).then(async searchResults => {
            if (searchResults.products) {
                if (searchResults.products.results.length > 0) {
                    let embedList = [];
                    let selectableItems = [];
                    for (let item of searchResults.products.results.splice(0, 10)) {
                        let embed = await productEmbeds.product(item.productID, state, interaction, db, true);
                        if (embed === undefined) {
                            console.log("undefined!");
                            return;
                        }
                        embedList.push(embed.popularEmbed);
                        selectableItems.push({label: embed.product.name.substr(0, 99), description: embed.product.description.substr(0, 99), value: embed.product.productID.toString()});
                    }
                    console.log(selectableItems);
                    let actionRow = new MessageActionRow()
                        .addComponents(
                            new MessageSelectMenu()
                                .setCustomId('selectPopular')
                                .setPlaceholder('Valitse')
                                .addOptions(selectableItems),
                        )
                    interaction.reply({content: 'Hakutulos:', embeds: embedList, components: [actionRow]});
                } else {
                    interaction.reply(utils.templates.searchNotFound);
                }
            }
        }).catch(err => {
            console.error(err);
        });
        return;
    }
    interaction.reply(utils.templates.invalidQuery);
}

function select(state, interaction, db) {
    let split = interaction.values;
    let id = parseInt(split[0]);
    if (!isNaN(id)) {
        productEmbeds.product(id, state, interaction, db).then(result => {
            if (result !== undefined) {
                state.temp = utils.defaultTemp();
                state.temp.currentProduct = result.product;
                db.updateUser(interaction.user.id, state).then(() => {
                    let msgPayload = {components: [result.sizesRow]};
                    if (result.content) {
                        msgPayload.content = result.content;
                    } else {
                        msgPayload.embeds = [result.popularEmbed];
                    }
                    console.log(msgPayload);
                    interaction.reply(msgPayload);
                }).catch(err => {
                    console.error(err);
                    interaction.reply(utils.templates.error);
                })
            } else
                interaction.reply(utils.templates.productNotFound);
        }).catch(err => {
            console.error(err);
        })
    }
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



function list(state, interaction) {
    let iterator = new AsyncIterator(undefined, undefined, state.orderItems);
    let total = 0;
    let prodEmbeds = [];
    iterator.callback = (item, index) => {
        productEmbeds.addedProduct(item, index).then(embed => {
            prodEmbeds.push(embed.embed);
            total += embed.price;
            iterator.nextItem();
        }).catch(err => {
            console.error(err);
        })
    }
    iterator.endCallback = () => {
        interaction.reply({content: "**Tuotteet**\nYhteensä: **"+total+"€**\n\n", embeds: prodEmbeds, components: [
                new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setCustomId('order')
                            .setLabel('Siirry tilaukseen')
                            .setDisabled(state.orderItems.length < 1)
                            .setStyle('PRIMARY'),
                        new MessageButton()
                            .setCustomId('removeCart')
                            .setDisabled(state.orderItems.length < 1)
                            .setLabel('Poista tuote ostoskorista')
                            .setStyle('PRIMARY'),
                    )
            ]})
    }
    iterator.nextItem();
}


module.exports = {
    search,
    select,
    deselect,
    list,
}