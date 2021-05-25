const api = require('../kotipizza/api');

api.getShops().then(shops => {
    shops.forEach(shop => {
        console.log("ID: "+shop.shopId+", Name: "+shop.displayName);
        console.log("Address: "+shop.streetAddress+","+shop.zip+","+shop.city);
    });
})