const embeds = require('../embeds/product');

function handle(state, interaction) {
    embeds.popularProducts().then(embed => {
        interaction.reply({ embeds: [ embed.popularEmbed ], components: [embed.row] });
    }).catch(err => {
        console.error(err);
    })
}

module.exports = {
    handle
}
