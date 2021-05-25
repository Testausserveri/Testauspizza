const utils = require('../utils');

function start(state, msg, client, db) {
    if (msg.content.trim().includes("!pizza")) {
        // start selection
        state.state = "selection";
        db.updateUser(msg.author.id, state).then(() => {
            msg.channel.send(utils.templates.welcome);
        }).catch(err => {
            console.error(err);
            msg.channel.send(utils.templates.error);
        });
    } else {
        msg.channel.send(utils.templates.startSession);
    }
}

function stop(state, msg, client, db) {
    db.updateUser(msg.author.id, utils.defaultState()).then(() => {
        msg.channel.send(utils.templates.done);
    }).catch(err => {
        console.error(err);
        msg.channel.send(utils.templates.error);
    });
}

module.exports = {
    start,
    stop
}