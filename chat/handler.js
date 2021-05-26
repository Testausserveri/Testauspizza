const utils = require('./utils');
const sizeModule = require('./modules/size');
const pizzaViewer = require('./modules/pizzaviewer');
const popularModule = require('./modules/popular');
const sessionModule = require('./modules/session');
const ingredientsModule = require('./modules/ingredients');
const productsModule = require('./modules/products');

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
                        productsModule.add(state, msg, client, db);
                    } else if (msg.content === "!cart") {
                        productsModule.list(state, msg, client, db);
                    } else if (msg.content.startsWith("!rs ")) {
                        productsModule.remove(state, msg, client, db);
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
            }
        }
    }).catch(err => {
        console.error(err);
        msg.channel.send(utils.templates.error);
    })
}

module.exports = {
    onMessage
}