const api = require('../kotipizza/api');
const Discord = require("discord.js");
const utils = require('./utils');
const apiConfig = require('../kotipizza/config');
const {MessageActionRow, MessageSelectMenu} = require("discord.js");

function selectedIngredientsPicker(list) {
    return new Promise((resolve, reject) => {
        let ingredientFields = [];
        api.getIngredients().then(ingredients => {
            list.forEach(listItem => {
                ingredients.forEach(item => {
                    if (listItem.id === item.ingredientID) {
                        ingredientFields.push({label: item.name, description: (item.summaryDescription || item.description).substr(0, 99), value: item.ingredientID.toString()});
                    }
                })
            });
            resolve(new MessageActionRow()
                .addComponents(
                    new MessageSelectMenu()
                        .setCustomId('selectDeletableIngredient')
                        .setPlaceholder('Valitse')
                        .addOptions(ingredientFields),
                ));
        }).catch(err => {reject(err);});
    });
}

function ingredientsPicker() {
    return new Promise((resolve, reject) => {
        api.getIngredients().then(ingredients => {
            let ingredientFields = ingredients.map(item => {return {label: (item.name || "Ei kuvausta").substr(0, 99), description: (item.summaryDescription || item.description || "Ei saatavilla").substr(0, 99), value: item.ingredientID.toString()}})
            resolve(new MessageActionRow()
                .addComponents(
                    new MessageSelectMenu()
                        .setCustomId('selectAddableIngredient')
                        .setPlaceholder('Valitse')
                        .addOptions(ingredientFields.splice(0, 25)),
                ));
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
    if (shop['openFor'+utils.capitalizeFirstLetter(deliveryType.toLowerCase()+"Status")] !== "OPEN") {
        fields.push({name: '**Kiinni**', value: `[Aukioloajat](${utils.getRestaurantLink(shop)})`})
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

function paymentMethodURLs(order) {
    let fields = [];
    if (order.cashPaymentEnabled) {
        fields.push({id: "kateinen", name: "Käteinen", category: "Maksu noutaessa", url: apiConfig.getCODPaymentLink(order.orderKey, order.orderID)})
    }
    order.paymentMethodsV2.forEach(method => {
        if (method.url)
            fields.push({id: method.id+method.name, name: method.name, category: utils.resolvePaymentGroupName(method), url: buildMethodPaymentUrl(method)})
    });
    return fields;
}

module.exports = {
    ingredients,
    ingredientCategories,
    shopEmbed,
    paymentMethodsEmbed,
    selectedIngredientsPicker,
    ingredientsPicker,
    paymentMethodURLs
}