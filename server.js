'use strict';

const { reset } = require('nodemon');

// file containing environment variables 
require('dotenv').config();
// console.log(process.env.TOKEN);


// Imports dependencies and set up http server
const
  express = require('express'),
  bodyParser = require('body-parser'),
  app = express().use(bodyParser.json()); // creates express http server


//include module to enable request to be send to facebook server 
const request = require('request');


 // Handles messages events
 function handleMessage(sender_psid, received_message) {
  let response;

  // Check if the message contains text
  if (received_message.text) {    

    // Create the payload for a basic text message
    response = {
      "text": `You sent the message: "${received_message.text}". Now send me an image!`
    }
  }  
  
  // Sends the response message
  callSendAPI(sender_psid, response);
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
  let response;

  // Get the payload for the postback
  let payload = received_postback.payload;

  // Set the response based on the postback payload
  if (payload === '<postback_payload>') {
    response = {
      "text": "Nice step, which of the following are you?",
      "quick_replies":[
        {
          "content_type":"text",
          "title":"Tenant",
          "payload":"TENANT",
        },{
          "content_type":"text",
          "title":"Landlord",
          "payload":"LANDLORD",
        }
      ]
    }

  } else if (payload === 'FIND_HOME') {
    response = { "text":"You will be able to find a home soon, but this feature is undergoing development now!" }
  }else if (payload === 'RENT_SPACE') {
    response = { "text":"You will be able to rent a space soon, but this feature is undergoing development now!" }
  }else if (payload === 'ABOUT') {
    response = { "text":"Thanks for your intrest in knowing more about CribAgent, info about me will be avaliable soon." }
  }else if (payload === 'PRO') {
    response = { "text":"With our pro features you'll have lots of goodies, please be patience while we complete it." }
  }else if (payload === 'FEEDBACK') {
    response = { "text":"Your honest feedback is welcome." }
  }
  // Send the message to acknowledge the postback
  callSendAPI(sender_psid, response);
}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
    // "messaging-type":"RESPONSE",
    // "message":{
    //   "text": "Pick a color:",
    //   "quick_replies":[
    //     {
    //       "content_type":"text",
    //       "title":"Red",
    //       "payload":"<POSTBACK_PAYLOAD>",
    //       "image_url":"http://example.com/img/red.png"
    //     },{
    //       "content_type":"text",
    //       "title":"Green",
    //       "payload":"<POSTBACK_PAYLOAD>",
    //       "image_url":"http://example.com/img/green.png"
    //     }
    //   ]
    // }
    
  }

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": process.env.TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  });
}



//ROUTES
app.get("/",(req,res)=>{
    // res.send("Welcome! I am CribAgent and I am here to help you find homes base upon your budget and comfort.");
    res.send(JSON.stringify({message:"Welcome! I am CribAgent and I am here to help you find homes base upon your budget and comfort."}));
})

// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {  
 
    let body = req.body;

    // Checks this is an event from a page subscription
    if (body.object === 'page') {
  
      // Iterates over each entry - there may be multiple if batched
      body.entry.forEach(function(entry) {
  
        // Gets the message. entry.messaging is an array, but 
        // will only ever contain one message, so we get index 0
        let webhook_event = entry.messaging[0];
        console.log(webhook_event);

        //Get Sender PSID
        let sender_psid = webhook_event.sender.id;
        console.log('Sender PSID: ' + sender_psid);

        // Check if the event is a message or postback and
        // pass the event to the appropriate handler function
        if (webhook_event.message) {
          handleMessage(sender_psid, webhook_event.message);        
        } else if (webhook_event.postback) {
          handlePostback(sender_psid, webhook_event.postback);
        }
      });
  
      // Returns a '200 OK' response to all requests
      res.status(200).send('EVENT_RECEIVED');
    } else {
      // Returns a '404 Not Found' if event is not from a page subscription
      res.sendStatus(404);
    }
  
});


// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

    // Your verify token. Should be a random string.
    let VERIFY_TOKEN = process.env.TOKEN;
      
    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];
      
    // Checks if a token and mode is in the query string of the request
    if (mode && token) {
    
      // Checks the mode and token sent is correct
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        
        // Responds with the challenge token from the request
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);
      
      } else {
        // Responds with '403 Forbidden' if verify tokens do not match
        res.sendStatus(403);      
      }
    }
  });



// Sets server port and logs message on success
app.listen(process.env.PORT || 3500, () => console.log('webhook is listening'));