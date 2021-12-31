const utils = require('./utils');
const sizeModule = require('./modules/size');
const pizzaViewer = require('./modules/pizzaviewer');
const popularModule = require('./modules/popular');
const sessionModule = require('./modules/session');
const ingredientsModule = require('./modules/ingredients');
const productsModule = require('./modules/products');
const productsActionsModule = require('./modules/productActions');
const orderModule = require('./modules/order');
const ingredientsEmbeds = require('./embeds/ingredients');
const {Interaction} = require("discord.js");
const {Database} = require('../db/db');
const { SlashCommandBuilder } = require('@discordjs/builders');

const interactionCommands = [
    {
        name: 'cancel',
        description: 'Tyhjennä ostoslista ja aloita alusta'
    },
    {
        name: 'popular',
        description: 'Listaa suositut tuotteet'
    },
    {
        name: 'cart',
        description: 'Näytä ostoskori'
    },
    new SlashCommandBuilder().setName('search')
        .setDescription('Hae tuotteita')
        .addStringOption((option =>
            option.setName('hakusana')
                .setDescription('hakusana')
                .setRequired(true)))
]

/**
 * @deprecated Old text-command based handler
 * @param msg
 * @param client
 * @param db
 */
function onMessage(msg, client, db) {
    db.getUserOrCreate(msg.author.id).then(state => {
        state = state.state;
        if (state.state === undefined) {
            sessionModule.start(state, msg, client, db);
        } else {
            if (msg.content === "!cancel") {
                sessionModule.stop(state, msg, client, db);
                return;
            }
            switch (state.state) {
                case "selection": {
                    // Handle selections such as adding a new product
                    if (msg.content === "!popular") {
                        popularModule.handle(state, msg, client, db);
                    } else if (msg.content.startsWith("!select ")) {
                        productsModule.select(state, msg, client, db);
                    } else if (msg.content === "!deselect") {
                        productsModule.deselect(state, msg, client, db);
                    } else if (msg.content === "!add") {
                        productsActionsModule.add(state, msg, client, db);
                    } else if (msg.content === "!cart") {
                        productsModule.list(state, msg, client, db);
                    } else if (msg.content.startsWith("!rs ")) {
                        productsActionsModule.remove(state, msg, client, db);
                    } else if (msg.content.startsWith("!search ")) {
                        productsModule.search(state, msg, client, db);
                    } else if (msg.content === "!pizza" && state.temp.currentProduct) {
                        pizzaViewer.handle(state, msg, client, db);
                    } else if (msg.content.startsWith("!size ") && state.temp.currentProduct && !state.temp.currentSize) {
                        sizeModule.handle(state, msg, client, db);
                    } else if (msg.content.startsWith("!ri ") && state.temp.currentProduct && state.temp.currentSize) {
                        ingredientsModule.remove(state, msg, client, db);
                    } else if (msg.content.startsWith("!ai ") && state.temp.currentProduct && state.temp.currentSize) {
                        ingredientsModule.add(state, msg, client, db);
                    } else if (msg.content.startsWith("!si ") && state.temp.currentProduct && state.temp.currentSize) {
                        ingredientsModule.search(state, msg, client, db);
                    } else if (msg.content === "!ki" && state.temp.currentProduct && state.temp.currentSize) {
                        ingredientsModule.categories(state, msg, client, db);
                    } else if (msg.content === "!li" && state.temp.currentProduct && state.temp.currentSize) {
                        ingredientsModule.list(state, msg, client, db);
                    } else if (msg.content === "!order" && state.orderItems && state.orderItems.length > 0) {
                        orderModule.startOrder(state, msg, client, db);
                    } else {
                        if (state.temp.currentProduct === undefined)
                            msg.channel.send(utils.templates.sessionCommands);
                        else if (state.temp.currentSize === undefined)
                            msg.channel.send(utils.templates.selectSize)
                        else
                            msg.channel.send(utils.templates.ingredientCommands);
                    }
                    break;
                }
                case 'ordering': {
                    if (msg.content === "!order") {
                        orderModule.startOrder(state, msg, client, db);
                        return;
                    } else if (msg.content.startsWith("!select ")) {
                        orderModule.selectLocation(state, msg, client, db);
                        return;
                    }
                    orderModule.inputWhileOrder(state, msg, client, db);
                    break;
                }
            }
        }
    }).catch(err => {
        console.error(err);
        msg.channel.send(utils.templates.error);
    })
}

/**
 * New handler based on discord interactions
 * @param interaction {Interaction}
 * @param db {Database}
 */
function onInteraction(interaction, db) {
    db.getUserOrCreate(interaction.user.id).then(async state => {
        state = state.state;
        if (state.state === undefined) {
            sessionModule.start(state, interaction, db);
        } else {
            if (interaction.isCommand()) {
                if (interaction.commandName === "cancel") {
                    sessionModule.stop(state, interaction, db);
                    return;
                }
                switch (state.state) {
                    case "selection": {
                        // Handle selections such as adding a new product
                        if (interaction.commandName === "popular") {
                            popularModule.handle(state, interaction, db);
                        } else if (interaction.commandName === "cart") {
                            productsModule.list(state, interaction, db);
                        } else if (interaction.commandName === "search") {
                            productsModule.search(state, interaction, db)
                        }
                        break;
                    }
                    case 'ordering': {
                        if (msg.content === "!order") {
                            orderModule.startOrder(state, msg, client, db);
                            return;
                        } else if (msg.content.startsWith("!select ")) {
                            orderModule.selectLocation(state, msg, client, db);
                            return;
                        }
                        orderModule.inputWhileOrder(state, msg, client, db);
                        break;
                    }
                }
            } else if (interaction.isSelectMenu()) {
                switch (state.state) {
                    case "selection": {
                        // Handle selections such as adding a new product
                        if (interaction.customId === "selectPopular" && interaction.values) {
                            productsModule.select(state, interaction, db);
                        } else if (interaction.customId === "selectPizzaSize" && interaction.values && state.temp.currentProduct && !state.temp.currentSize) {
                            sizeModule.handle(state, interaction, db);
                        } else if (interaction.customId === "selectDeletableIngredient" && interaction.values && state.temp.currentProduct && state.temp.currentSize) {
                            await ingredientsModule.remove(state, interaction, db);
                            await ingredientsEmbeds.showIngredientsCard(state, interaction);
                        } else if (interaction.customId === "removeCartSelection" && interaction.values && state.orderItems.length > 0) {
                            await productsActionsModule.removeById(state, interaction, db, interaction.values[0]);
                        }
                        break;
                    }
                    case 'ordering': {

                        break;
                    }
                }
            } else if (interaction.isButton()) {
                switch (state.state) {
                    case "selection": {
                        // Handle selections such as adding a new product
                        if (interaction.customId === "deleteIngredient" && state.temp.currentProduct && state.temp.currentSize) {
                            ingredientsModule.deletePrompt(state, interaction);
                        } else if (interaction.customId === "addIngredient" && state.temp.currentProduct && state.temp.currentSize) {
                            ingredientsModule.addPrompt(state, interaction);
                        } else if (interaction.customId === "addItem" && state.temp.currentProduct && state.temp.currentSize) {
                            productsActionsModule.add(state, interaction, db);
                        } else if (interaction.customId === "cart") {
                            productsModule.list(state, interaction, db);
                        } else if (interaction.customId === "removeCart" && state.orderItems.length > 0) {
                            if (state.orderItems.length === 1) {
                                // single item
                                productsActionsModule.remove(state, interaction, db);
                            } else {
                                // Invoke picker
                                productsActionsModule.removePicker(state, interaction, db);
                            }
                        }
                        break;
                    }
                    case 'ordering': {
                        break;
                    }
                }
            }
        }
    }).catch(err => {
        console.error(err);
    })

}

module.exports = {
    onMessage,
    onInteraction,
    interactionCommands
}