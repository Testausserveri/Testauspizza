const utils = require("../utils");
const commonEmbeds = require("../embeds/common");
const {MessageActionRow, MessageSelectMenu} = require("discord.js");

async function add(state, interaction, db, onlyResult=false) {
    if (state.temp.currentProduct !== undefined && state.temp.currentSize !== undefined) {
        state.orderItems.push({product: state.temp.currentProduct, size: state.temp.currentSize, ingredients: state.temp.ingredients});
        state.temp = utils.defaultTemp();
        await db.updateUser(interaction.user.id, state);
        if (!onlyResult)
            interaction.reply(commonEmbeds.actionCompleteWithCartActions);
        else
            return commonEmbeds.actionCompleteWithCartActions;
    }
}

function remove(state, interaction, db, id="1") {
    id = parseInt(id);
    if (!isNaN(id)) {
        id = id-1;
        if (typeof state.orderItems[id] !== 'undefined') {
            state.orderItems.splice(id, 1);
            db.updateUser(interaction.user.id, state).then(() => {
                interaction.reply(commonEmbeds.actionCompleteWithCartActions);
            }).catch(err => {
                console.error(err);
            })
        }
    }
}

function removeById(state, interaction, db, id) {
    id = state.orderItems.map(i => i.product.productID).indexOf(parseInt(id))
    if (!isNaN(id)) {
        if (typeof state.orderItems[id] !== 'undefined') {
            state.orderItems.splice(id, 1);
            db.updateUser(interaction.user.id, state).then(() => {
                interaction.reply(commonEmbeds.actionCompleteWithCartActions);
            }).catch(err => {
                console.error(err);
            })
        }
    }
}

function removePicker(state, interaction, db) {
    if (state.orderItems.length > 0) {
        let selectableItems = state.orderItems.map(i => {return {label: i.product.name.substr(0, 99), description:  i.product.description.substr(0, 99), value:  i.product.productID.toString()}})
        let actionRow = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId('removeCartSelection')
                    .setPlaceholder('Valitse')
                    .addOptions(selectableItems),
            )
        interaction.reply({content: utils.templates.selectDeletableCartItem, components: [actionRow]})
    }
}

module.exports = {
    add, remove, removePicker, removeById
}