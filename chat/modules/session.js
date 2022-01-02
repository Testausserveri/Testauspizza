const utils = require('../utils');

async function start(state, interaction, db) {
    state.state = "selection";
    await db.updateUser(interaction.user.id, state)
}

function stop(state, interaction, db) {
    db.updateUser(interaction.user.id, utils.defaultState()).then(() => {
        interaction.reply(utils.templates.done);
    }).catch(err => {
        console.error(err);
    });
}

module.exports = {
    start,
    stop
}