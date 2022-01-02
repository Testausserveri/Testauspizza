const Discord = require("discord.js");
const config = require("./config.json");
const cmdReader = require("./chat/handler")
const client = new Discord.Client({ partials: ["CHANNEL"], intents: [Discord.Intents.FLAGS.DIRECT_MESSAGES, Discord.Intents.FLAGS.GUILD_MESSAGES]});
const db = require('./db/db');

Array.prototype.random = function () {
    return this[Math.floor((Math.random()*this.length))];
}

const dataBase = new db.Database(config.db.dbname, config.db.username, config.db.password, config.db.host);

global.config = config;

client.on("messageCreate", async function (message) {
    if (message.author.bot)
        return;
    if (config.debug)
        console.log(message);
    if (message.channel.type === Discord.Constants.TextBasedChannelTypes[Discord.Constants.ChannelTypes.DM - 1] && message.author.id !== client.user.id) {
        // DM message
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


