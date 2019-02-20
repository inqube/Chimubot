// Declare const/vars
const Discord = require('discord.js');
const fs = require("fs");
const client = new Discord.Client();
const config = require("./config.json")
const keys = require("./private.json");

// Store token in config (DO NOT PASTE TOKEN OUTSIDE OF PRIVATE)
let token = keys.token;
var prefix = config.prefix;

// Read commands from command folder
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith('.js'));

// populate commands from commandFile array
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

// Return ready status
client.once("ready", () => {
  console.log("Ready!");
});

// Run commands
client.on('message', message => {
  const args = message.content.slice(prefix.length).split(/ +/);
  const command = args.shift().toLowerCase();

  console.log(command + " was executed!")

  // Check for command received and execute appropriate command
  if (!client.commands.has(command)) return;
  try {
    client.commands.get(command).execute(message, args);
  } catch (error) {
    console.error(error);
    message.reply('there was an error trying to execute that command!');
  }


});

// Send token
client.login(token)
