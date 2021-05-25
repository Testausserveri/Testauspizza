
const Discord = require("discord.js");
const config = require("./config.json");
const cmdReader = require("./chat/handler")
const client = new Discord.Client();
const db = require('./db/db');

const dataBase = new db.Database(config.db.dbname, config.db.username, config.db.password, config.db.host);

client.on("message", function (message) {
    if (message.channel.type === "dm" && message.author.id !== client.user.id) {
        // DM message
        if (config.debug)
            console.log(message.content);
        cmdReader.onMessage(message, client, dataBase);
    }
});


console.log("Connecting to Database");
dataBase.connect().then(function () {
    console.log("DB connected");
    console.log("Connecting to Discord");
    client.login(config.token).then(function () {
        console.log("Bot connected!");
        console.log("Setting status");
        client.user.setActivity({
            type: 'PLAYING',
            name: 'kotipizza.fi'
        });
    }).catch(function (reason) {
        console.log("Connection failed");
        console.log(reason);
    });
});


