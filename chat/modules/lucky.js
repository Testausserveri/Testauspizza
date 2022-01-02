const productModule = require('./products');
const api = require("../../kotipizza/api");

function feelingLucky(state, interaction, db) {
    api.getPopularProducts().then(products => {
        let product = products.random();
        productModule.select(state, interaction, db, product.productID.toString());
    });
}

module.exports = {
    feelingLucky
}