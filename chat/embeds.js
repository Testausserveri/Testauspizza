const api = require('../kotipizza/api');
const Discord = require("discord.js");
const utils = require('./utils');
const apiConfig = require('../kotipizza/config');

function popularProducts() {
    return new Promise((resolve, reject) => {
        api.getPopularProducts().then(products => {
            let embedProducts = [];
            products.forEach(item => {
                embedProducts.push({name: item.name+" ("+item.productID+")", value: item.description});
            });
            let popularEmbed = new Discord.MessageEmbed()
                .setColor('#4bc601')
                .setTitle('Suosituimmat ateriat')
                .addFields(embedProducts);
            resolve(popularEmbed);
        }).catch(err => {reject(err)});
    });
}

function product(id, thumbnail=false) {
    return new Promise((resolve, reject) => {
        api.getProduct(id).then(product => {
            if (product === undefined) {
                resolve(undefined);
                return;
            }
            let sizes = product.productSizes.map(item => {return item.name+" ("+item.productSizeID+")"+(item.calculatedPrice ? " "+item.calculatedPrice+"€" : "")}).join(", ");
            let popularEmbed = new Discord.MessageEmbed()
                .setColor('#4bc601')
                .setThumbnail(thumbnail ? product.imagepath : undefined)
                .setImage(!thumbnail ? product.imagepath : undefined)
                .setTitle(product.name)
                .addField("Kuvaus", product.description)
                .addField("Numero", product.productID)
                .addField("Hinta", (product.hasMinimumPrice ? "alk. " : "")+product.price+"€")
                .addField("Mausteinen", product.isSpicy ? "Kyllä" : "Ei")
                .addField("Koot", sizes)
            resolve({popularEmbed, product});
        }).catch(err => {reject(err)});
    });
}

function addedProduct(product, index) {
    return new Promise((resolve, reject) =>  {
        utils.calculatePrice(product).then(price => {
            let embed = new Discord.MessageEmbed()
                .setColor('#4bc601')
                .setThumbnail(product.product.imagepath)
                .setTitle(product.product.name)
                .addField("Kuvaus", product.product.description)
                .addField("Numero", index+1)
                .addField("Ainesosat", price.ingredients)
                .addField("Alustava hinta", (product.product.hasMinimumPrice ? "alk. " : "")+product.product.price+"€")
                .addField("Hinta (+ ainesosat)", price.price+"€")
                .addField("Mausteinen", product.product.isSpicy ? "Kyllä" : "Ei")
                .addField("Koko", product.size.name+" ("+product.size.productSizeID+")"+(product.size.calculatedPrice ? " "+product.size.calculatedPrice+"€" : ""));
            resolve({embed, price: price.price});
        }).catch(err => {reject(err);})
    });
}

function selectedIngredients(list) {
    return new Promise((resolve, reject) => {
        let ingredientFields = [];
        api.getIngredients().then(ingredients => {
            list.forEach(listItem => {
                ingredients.forEach(item => {
                    if (listItem.id === item.ingredientID) {
                        ingredientFields.push({name: '('+item.ingredientID+') '+item.name, value: item.summaryDescription || item.description});
                    }
                })
            });
            let ingredientsEmbed = new Discord.MessageEmbed()
                .setColor('#4bc601')
                .setTitle("Valitut ainesosat")
                .addFields(ingredientFields);
            resolve(ingredientsEmbed);
        }).catch(err => {reject(err);});
    });
}

function ingredients(ingredients, size) {
    return new Promise((resolve, reject) => {
        api.getIngredientCategories().then(categories => {
            let ingredientFields = [];
            ingredients.forEach(item => {
                if (item.isActive) {
                    let ingredientDosing = item.ingredientdosings.filter(item => {return item.productSizeID === size.productSizeID && item.active});
                    if (ingredientDosing.length > 0) {
                        let category = categories.filter(cat => {return cat.ingredientCategoryID === item.ingredientCategoryID});
                        ingredientFields.push({name: (category.length > 0 ? category[0].name + ' -> ' : '' )+ '('+item.ingredientID+') '+item.name+`, ${ingredientDosing[0].priceWithVAT||0}€`, value: item.summaryDescription || item.description});
                    }
                }
            })
            if (ingredientFields.length < 1) {
                resolve(undefined);
                return;
            }
            resolve(new Discord.MessageEmbed()
                .setColor('#4bc601')
                .setTitle("Ainesosat")
                .addFields(ingredientFields));
        }).catch(err => {reject(err);});
    });

}

function ingredientCategories(categories) {
    let categoryFields = [];
    categories.forEach(item => {
        categoryFields.push({name: item.name, value: item.ingredientCategoryID});
    })
    return new Discord.MessageEmbed()
        .setColor('#4bc601')
        .setTitle("Ainesosien kategoriat")
        .addFields(categoryFields);
}

function shopEmbed(shop, deliveryType) {
    let fields = [
        {name: 'Osoite', value: [shop.streetAddress, shop.zipCode, shop.city].join(", ")}
    ];
    if (deliveryType === utils.constants.deliveryTypes.delivery)
        fields.push({name: 'Kuljetusmaksu', value: `${shop.dynamicDeliveryFee ? 'Dynaaminen hinta, ': ''}${shop.dynamicDeliveryFee || shop.deliveryFee}€`});
    if (!shop['openFor'+utils.capitalizeFirstLetter(deliveryType.toLowerCase())]) {
        fields.push({name: '**Kiinni**', value: `[Aukioloajat](${utils.getRestaurantLink(shop)})`})
    } else {
        fields.push({name: 'Numero', value: shop.restaurantId});
    }
    return new Discord.MessageEmbed()
        .setColor('#4bc601')
        .setTitle(shop.displayName)
        .addFields(fields);
}

function buildMethodPaymentUrl(method) {
    let endpoint = method.url;
    let queryParams = [];
    method.parameters.forEach(param => {
        queryParams.push([param.name, encodeURIComponent(param.value)].join("="));
    });
    return endpoint+'?'+queryParams.join("&");
}

function paymentMethodsEmbed(order) {
    let fields = [];
    if (order.cashPaymentEnabled) {
        fields.push(new Discord.MessageEmbed()
            .setColor('#4bc601')
            .setTitle("Käteinen")
            .setURL(apiConfig.getCODPaymentLink(order.orderKey, order.orderID)))
    }
    order.paymentMethodsV2.forEach(method => {
        fields.push(new Discord.MessageEmbed()
            .setColor('#4bc601')
            .setTitle(method.name)
            .setURL(buildMethodPaymentUrl(method)))
    });
    return fields;
}

module.exports = {
    popularProducts,
    product,
    selectedIngredients,
    ingredients,
    ingredientCategories,
    addedProduct,
    shopEmbed,
    paymentMethodsEmbed
}