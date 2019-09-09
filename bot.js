var Discord = require('discord.js');
const winston = require('winston');
var auth = require('./auth.json');
var fs = require("fs");
const contents = fs.readFileSync("./media/audio/audioData.json");
const messagesContents = fs.readFileSync("./media/messages/botMessages.json");
var messages = JSON.parse(messagesContents);
var audioFiles = JSON.parse(contents);
var isReady = true;

// Configure logger settings
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
      //
      // - Write to all logs with level `info` and below to `combined.log` 
      // - Write all logs error (and below) to `error.log`.
      //
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      new winston.transports.File({ filename: 'combined.log' }),
      new winston.transports.Console({colorize: true})
    ]
});

// Initialize Discord Bot
var bot = new Discord.Client();
bot.login(auth.token);
bot.on('ready', () => {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});
bot.on('message', message => {
    const commandPostpend = ", ";
    message.content = message.content.toLowerCase();
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (isReady && message.content.substring(0, 1) == '!') {
        isReady = false;
        var args = message.content.substring(1).split(' ');
        var cmd = args[0];

        var commandListString = "The Text Commands are:\n";
        var commandPrepend = "!";
        if (cmd === "commands"){
            messages.forEach(function(commandPair){
                commandPair.command.forEach(function(cmdText){
                    commandListString += commandPrepend + cmdText + commandPostpend;
                });
                commandListString = commandListString.substring(0, commandListString.length - 2);
                commandListString += " **|** "
            });
            commandListString = commandListString.substring(0, commandListString.length - 7);
            message.channel.send(commandListString);
        } else {
            args = args.splice(1);
            messages.forEach(function(commandPair){
                commandPair.command.forEach(function(cmdText){
                    if (cmdText == cmd){
                        message.channel.send(commandPair.message);
                    }
                });
            });
        }
        isReady = true;
     } else if (isReady && message.content.substring(0,1) == "?"){
        isReady = false;
        var args = message.content.substring(1).split(' ');
        var cmd = args[0];
       
        args = args.splice(1);
        switch(cmd) {
            case 'commands':
                //todo
                var commandListString = "The Audio Commands are:\n";
                var commandPrepend = "?";
                audioFiles.forEach(function (audioClip){
                    audioClip.SoundName.forEach(function (clipCommand){
                        commandListString += commandPrepend + clipCommand + commandPostpend;
                    });
                    commandListString = commandListString.substring(0, commandListString.length - 2);
                    commandListString += " **|** "
                });
                commandListString = commandListString.substring(0, commandListString.length - 7);
                message.channel.send(commandListString);
                isReady = true;
            break;
        }

        audioFiles.forEach(function(audioClip){
            audioClip.SoundName.forEach(function (clipCommand){
                if(cmd == clipCommand){
                    playAudio(audioClip.SoundUrl, message);
                    isReady = true;
                }
            })
        })
     }
});


function playAudio(audioClipUrl, message){
    var voiceChannel = message.member.voiceChannel
    if (voiceChannel !== undefined){
    voiceChannel.join()
        .then(connection => {
            const dispatcher = connection.playArbitraryInput(audioClipUrl);
            dispatcher.setVolume(0.05);
            dispatcher.resume();
            dispatcher.on("end", end =>{
                voiceChannel.leave();
            });
        }).catch(error => {
            logger.error(error);
        });
    } else {
        message.channel.send("Please join a voice channel to use audio commands. \nAudio commands start with a '?'")
    }
}