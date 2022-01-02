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

const startOrderWithOptions = {
    content: ["  **Tilaus**  ", ["->", utils.templates.orderingGuide].join(" ")].join("\n"),
    components: [
        new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('deliveryNouto')
                    .setLabel('Nouto')
                    .setStyle('PRIMARY'),
                new MessageButton()
                    .setCustomId('deliveryRavintola')
                    .setLabel('Ravintola')
                    .setStyle('PRIMARY'),
                new MessageButton()
                    .setCustomId('deliveryToimitus')
                    .setLabel('Toimitus')
                    .setStyle('PRIMARY'),
            )
    ]
}

module.exports = {
    actionCompleteWithCartActions,
    startOrderWithOptions
}