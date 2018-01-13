#!/usr/bin/env node


const rp = require('request-promise-native');

//var external.repo = 'web-lightning'



const postToSlack = function postToSlack() {
    //var upgrade.template.id = '4.0.0'
    //global var instance = 'web-lightning-ui'
    let instance = 'web-lightning-ui'
//    GLOBAL.instance = require("web-lightning-ui");
var options = {
    method: 'POST',
    uri: 'https://hooks.slack.com/services/<token stuff>',
    // this is deploy channel
    resolveWithFullResponse: true,
    headers: {
        'Content-Type':     'application/json',
    },
    //    body: { "channel": "#marc-richardson", "username": "rancher-tools", "text":"this is a test of posting to slack via node.js", "icon_emoji": ":excellent:" },
//            body: { "username": "rancher-tools", "text":"this is a test of posting to slack via node.js", "icon_emoji": ":excellent:" },
//    body: { "channel": "#marc-richardson", "username": "rancher-tools", "text":"deploying release ${upgrade.template.id} of ${external.repo} to ${project.name}", "icon_emoji": ":excellent:" },
    body: { "username": "rancher-tools", "text":`${action} deploy release ${instance} of  to `, "icon_emoji": ":excellent:" },
//                body: { "username": "rancher-tools", "text":`$action deploy release ${upgrade.template.id} of ${external.repo} to ${project.name}`, "icon_emoji": ":excellent:" },
    json: true, // Automatically stringifies the body to JSON
    simple: false
};

rp(options)
    .then(function (response) {
	console.log("posted deployment to slack")
    })
    .catch(function (err) {
	console.log(response.statusCode)
	console.log("post to slack failed")
    });
}

//postToSlack()
var action = 'starting deploy of'
postToSlack(action,instance)
var action = 'finishing deploy of'
postToSlack(action,instance)


