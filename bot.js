var Discord = require('discord.js');
var logger = require('winston');
var auth = require('./auth.json');
var fs = require("fs");
const contents = fs.readFileSync("./media/audio/audioData.json");
const messagesContents = fs.readFileSync("./media/messages/botMessages.json");
var messages = JSON.parse(messagesContents);
var audioFiles = JSON.parse(contents);
var isReady = true;

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

// Initialize Discord Bot
var bot = new Discord.Client();
bot.on('ready', () => {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});
bot.on('message', message => {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (isReady && message.content.substring(0, 1) == '!') {
        isReady = false;
        var args = message.content.substring(1).split(' ');
        var cmd = args[0];
       
        args = args.splice(1);
        messages.forEach(function(commandPair){
            commandPair.command.forEach(function(cmdText){
                if (cmdText == cmd){
                    message.channel.send(commandPair.message);
                }
            });
        })
        isReady = true;
     } else if (isReady && message.content.substring(0,1) == "?"){
        isReady = false;
        var args = message.content.substring(1).split(' ');
        var cmd = args[0];
       
        args = args.splice(1);
        switch(cmd) {
            case 'commands':
                //todo
                isReady = true;
            break;
        }

        audioFiles.forEach(function(audioClip){
            if(cmd == audioClip.SoundName){
                playAudio(audioClip.SoundUrl, message);
                isReady = true;
            }
        })
     }
});

bot.login(auth.token);

function playAudio(audioClipUrl, message){
    var voiceChannel = message.member.voiceChannel
    voiceChannel.join()
        .then(connection => {
            const dispatcher = connection.playArbitraryInput(audioClipUrl);
            dispatcher.setVolume(0.05);
            dispatcher.resume();
            dispatcher.on("end", end =>{
                voiceChannel.leave();
            });
        }).catch(console.log);
}