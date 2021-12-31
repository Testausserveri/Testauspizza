const api = require("../../kotipizza/api");
const Discord = require("discord.js");
const products = require("../modules/productActions");
const {MessageActionRow, MessageButton} = require("discord.js");

async function showIngredientsCard(state, interaction, db, onlyResult=false) {
    let embed = await selectedIngredients(state.temp.ingredients);
    if (embed === undefined) {
        let reply = await products.add(state, interaction, db, true);
        if (onlyResult)
            return {content: reply.content, row: reply.components[0]};
        else {
            interaction.reply(reply);
            return;
        }
    }
    const row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('addItem')
                .setLabel('Jatka')
                .setStyle('SUCCESS'),
            /*new MessageButton()
                .setCustomId('addIngredient')
                .setLabel('Lisää ainesosa')
                .setStyle('PRIMARY'),*/
            new MessageButton()
                .setCustomId('deleteIngredient')
                .setLabel('Poista ainesosa')
                .setStyle('DANGER'),
        );
    if (onlyResult)
        return {embed, row};
    interaction.reply({embeds: [embed], components: [row]});
}

function selectedIngredients(list) {
    return new Promise((resolve, reject) => {
        let ingredientFields = [];
        api.getIngredients().then(ingredients => {
            list.forEach(listItem => {
                ingredients.forEach(item => {
                    if (listItem.id === item.ingredientID) {
                        ingredientFields.push({name: item.name, value: item.summaryDescription || item.description});
                    }
                })
            });
            if (ingredientFields.length === 1) {
                resolve(undefined);
                return;
            }
            let ingredientsEmbed = new Discord.MessageEmbed()
                .setColor('#4bc601')
                .setTitle("Valitut ainesosat")
                .addFields(ingredientFields);
            resolve(ingredientsEmbed);
        }).catch(err => {reject(err);});
    });
}

module.exports = {
    selectedIngredients,
    showIngredientsCard
}