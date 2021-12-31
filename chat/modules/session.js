const utils = require('../utils');

function start(state, interaction, db) {
    state.state = "selection";
    db.updateUser(interaction.user.id, state).then(() => {
        interaction.reply(utils.templates.welcome);
    }).catch(err => {
        console.error(err);
    });
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