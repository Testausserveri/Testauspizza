const utils = require("../utils");
const {MessageActionRow, MessageButton} = require("discord.js");

const actionCompleteWithCartActions = {content: utils.templates.done, components: [
        new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('cart')
                    .setLabel('Ostoskori')
                    .setStyle('PRIMARY'),
                new MessageButton()
                    .setCustomId('order')
                    .setLabel('Siirry tilaukseen')
                    .setStyle('PRIMARY'),
            )
    ]};

module.exports = {
    actionCompleteWithCartActions
}