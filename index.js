const Discord = require('discord.js');
const client = new Discord.Client();
const config = require("./config.json");

// Store token in config (DO NOT PASTE TOKEN OUTSIDE OF CONFIG)
let token = config.token;

  client.once("ready", () => {
    console.log("Ready!");
  });

  client.login(token)