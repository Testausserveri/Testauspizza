const api = require('../kotipizza/api');

api.getPopularProducts().then(products => {
    products.forEach(product => {
        console.log("ProductID: "+product.productID+", Name: "+product.name);
    });
})