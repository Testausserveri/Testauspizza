const api = require("../../kotipizza/api");
const {MessageActionRow, MessageSelectMenu} = require("discord.js");
const ingredientsEmbeds = require("./ingredients");
const Discord = require("discord.js");
const utils = require("../utils");

function product(id, state,interaction, db, thumbnail=false) {
    return new Promise((resolve, reject) => {
        api.getProduct(id).then(product => {
            if (product === undefined) {
                resolve(undefined);
                return;
            }
            let sizes = product.productSizes.map(item => {return {label: item.name.substr(0, 99), description: (item.calculatedPrice ? " "+item.calculatedPrice+"€" : ""), value: item.productSizeID.toString()}});
            const sizesRow = new MessageActionRow();
            console.log(sizes, thumbnail);
            if (sizes.length === 1 && !thumbnail) {
                state.temp.currentSize = product.productSizes[0];
                state.temp.ingredients = [...state.temp.currentSize.ingredients];
                state.temp.currentProduct = product;
                db.updateUser(interaction.user.id, state).then(async () => {
                    let embed = await ingredientsEmbeds.showIngredientsCard(state, interaction, db, true);
                    if (embed !== undefined)
                        resolve({content: embed.content, popularEmbed: embed.embed, product, sizesRow: embed.row});
                    else
                        resolve(undefined);
                }).catch(err => {
                    reject(err)
                })
                return;
            } else {
                sizesRow.addComponents(
                    new MessageSelectMenu()
                        .setCustomId('selectPizzaSize')
                        .setPlaceholder('Valitse koko')
                        .addOptions(sizes),
                );
            }

            let popularEmbed = new Discord.MessageEmbed()
                .setColor('#4bc601')
                .setThumbnail(product.imagepath)
                .setTitle(product.name)
                .setDescription(product.description)
                .addField("Hinta", (product.hasMinimumPrice ? "alk. " : "")+product.price+"€")
            resolve({popularEmbed, product, sizesRow});
        }).catch(err => {reject(err)});
    });
}

function addedProduct(product) {
    return new Promise((resolve, reject) =>  {
        utils.calculatePrice(product).then(price => {
            let embed = new Discord.MessageEmbed()
                .setColor('#4bc601')
                .setThumbnail(product.product.imagepath)
                .setTitle(product.product.name)
                .addField("Kuvaus", product.product.description)
                .addField("Ainesosat", price.ingredients)
                .addField("Alustava hinta", (product.product.hasMinimumPrice ? "alk. " : "")+product.product.price+"€")
                .addField("Hinta (+ ainesosat)", price.price+"€")
                .addField("Mausteinen", product.product.isSpicy ? "Kyllä" : "Ei")
                .addField("Koko", product.size.name+" "+(product.size.calculatedPrice ? " "+product.size.calculatedPrice+"€" : ""))
                .addFields();
            resolve({embed, price: price.price});
        }).catch(err => {reject(err);})
    });
}

function popularProducts() {
    return new Promise((resolve, reject) => {
        api.getPopularProducts().then(products => {
            let embedProducts = [];
            let selectableItems = [];
            products.forEach(item => {
                embedProducts.push({name: item.name, value: item.description});
                selectableItems.push({label: item.name.substr(0, 99), description: item.description.substr(0, 99), value: item.productID.toString()});
            });
            const row = new MessageActionRow()
                .addComponents(
                    new MessageSelectMenu()
                        .setCustomId('selectPopular')
                        .setPlaceholder('Valitse tuote ostoskoriin')
                        .addOptions(selectableItems),
                );
            let popularEmbed = new Discord.MessageEmbed()
                .setColor('#4bc601')
                .setTitle('Suosituimmat ateriat')
                .addFields(embedProducts);
            resolve({popularEmbed, row});
        }).catch(err => {reject(err)});
    });
}

module.exports = {
    product,
    addedProduct,
    popularProducts
}