const productModule = require('./products');
const api = require("../../kotipizza/api");
const utils = require("../utils");

function feelingLucky(state, interaction, db) {
    api.getProductsSortedByCategories().then(categories => {
        let filteredCategories = categories.filter(i => {
            return global.config.allowedFeelingLuckyCategories.includes(i.productCategoryID ?? 0);
        });
        let products = [];
        filteredCategories.forEach(category => {
            products = products.concat(category.products);
        })
        let product = products.random();
        if (product)
            productModule.select(state, interaction, db, product.productID.toString());
        else
            interaction.reply(utils.templates.luckFailed)
    });
}

module.exports = {
    feelingLucky
}