const Discord = require("discord.js");
const config = require("./config.json");
const cmdReader = require("./chat/handler")
const client = new Discord.Client({intents: []});
const db = require('./db/db');

const dataBase = new db.Database(config.db.dbname, config.db.username, config.db.password, config.db.host);

global.config = config;

client.on("message", function (message) {
    if (message.channel.type === "dm" && message.author.id !== client.user.id) {
        // DM message
        if (config.debug)
            console.log(message.content);
        cmdReader.onMessage(message, client, dataBase);
    }
});

client.on('interactionCreate', interaction => {
    if (config.debug)
        console.log(interaction);
    cmdReader.onInteraction(interaction, dataBase);
});

(async function() {
    console.log("Connecting to Database");
    await dataBase.connect();
    console.log("DB connected");
    console.log("Connecting to Discord");
    await client.login(config.token);
    console.log("Bot connected!");
    console.log("Setting status");
    client.user.setActivity({
        type: 'PLAYING',
        name: 'kotipizza.fi'
    });
    console.log("Setting commands...");
    await client.application.commands.set(cmdReader.interactionCommands);
})();


