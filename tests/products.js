const api = require('../kotipizza/api');

api.getProductsSortedByCategories().then(products => {
    products.forEach(item => {
        console.log("CatID: "+item.productCategoryID+", Name: "+item.productCategoryName);
        item.products.forEach(product => {
            console.log("ProductID: "+product.productID+", Name: "+product.name);
        });
        console.log("----------- \n\n");
    })
})