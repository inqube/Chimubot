const Discord = require('discord.js');
const client = new Discord.Client();
const config = require("./config.json")
const keys = require("./private.json");

// Store token in config (DO NOT PASTE TOKEN OUTSIDE OF PRIVATE)
let token = keys.token;
var prefix = config.prefix;

  // Return status
  client.once("ready", () => {
    console.log("Ready!");
  });

  client.login(token)

  // RUN STUFF FROM COMMANDS HERE
  
