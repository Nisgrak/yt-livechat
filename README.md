# YT-Livechat [![Build Status](https://travis-ci.com/siffreinsg/yt-livechat.svg?branch=master)](https://travis-ci.com/siffreinsg/yt-livechat)

[![NPM](https://nodei.co/npm/yt-livechat.png)](https://nodei.co/npm/yt-livechat/)

Create easily chat bots for any YouTube stream liveChat.

## Install
Install via NPM, PNPM or Yarn from repo
```bash
$ npm i yt-livechat --save
$ pnpm i yt-livechat
$ yarn add yt-livechat
```

## Simple example
```javascript
// Import the lib (delete one of the line depending on what you use)
const { LiveChat } = require("yt-livechat"); // NODE
import LiveChat from "yt-livechat" // TYPESCRIPT

// Let's do some config
const config = {
    interval: process.env.POLL_INT, // Time interval between each "list" request
    liveChatID: process.env.LIVE_CHAT_ID || "", // ID of the LiveChat
    oauth: { // OAuth2 keys from Google Developers Console
        client_id: process.env.CLIENT_ID || "",
        client_secret: process.env.CLIENT_SECRET || "",
        refresh_token: process.env.REFRESH_TOKEN || "",
    },
};

const chat = new LiveChat(config); // Init chat object

// Register some events
chat.on("connected", () => console.log("Connected to the YouTube API."));
chat.on("error", (error) => console.log(error));

chat.on("chat", (message) => {
    console.log(`New message from ${message.authorDetails.displayName}.`);

    if (message.snippet.displayMessage === "/hello") {
        chat.say("Hello world !");
	}
});

// Start polling messages
chat.connect();
```

## Summary
- [Constructor](https://github.com/siffreinsg/yt-livechat#constructor)
- [Properties](https://github.com/siffreinsg/yt-livechat#properties)
  - `auth`
  - `connected`
- [Methods](https://github.com/siffreinsg/yt-livechat#methods)
  - `connect()`
  - `disconnect()`
  - `reconnect()`
  - `say()`
  - `delete()`
- [Events](https://github.com/siffreinsg/yt-livechat#methods)
  - `connected`
  - `disconnected`
  - `reconnected`
  - `polling`
  - `tokens`
  - `error`
  - `chat`




## Constructor
##### Usage
```javascript
const { LiveChat } = require("yt-livechat");
const config = { ... };
const chat = new LiveChat(config);
```

##### Config structure
```typescript
{
    oauth: { // Find this on the Google Developers Console
    	client_id?: string;
    	client_secret?: string;
    	refresh_token?: string;
    };
    liveChatID: string; // ID of the LiveChat
    interval?: number; // Force time interval in ms between each poll.
}
```
You might be able to find ID of the Live Chat with [this API endpoint](https://developers.google.com/youtube/v3/live/docs/liveBroadcasts/list)



## Properties
### `auth: OAuth2Client` 
OAuth2 client from the [google-auth-library](http://npmjs.com/google-auth-library) lib. You can use it to make custom authenticated requests for example.

### `connected: boolean`
Equals `true` if the lib polls messages. Else equals `false`.



## Methods
#### All the public methods return the `LiveChat` object.

### `connect()`
Start polling messages from the chat.

##### Usage
```javascript
chat.connect()
```


### `disconnect()`
Stop polling messages from the chat.

##### Usage
```javascript
chat.disconnect()
```


### `reconnect()`
Re-create OAuth client and just execute `disconnect()`and `connect()`.

##### Usage
```javascript
chat.reconnect()
```


### `say(message: string)`
Send a message.

##### Usage
```javascript
chat.say("Hello !")
```


### `delete(messageId: string)`
Delete a message based on his ID.

##### Usage
```javascript
chat.delete("MESSAGE ID")
```



## Events
### `connected -> ()`
Emitted when the lib start polling messages from YouTube. Usually after the execution of the `connect()`method

##### Usage
```javascript
chat.on('connected', () => ... )
```


### `disconnected -> ()`
Emitted when the lib stop polling messages from YouTube. Usually after the execution of the `disconnect()`method

##### Usage
```javascript
chat.on('disconnected', () => ... )
```


### `reconnected -> ()`
Emitted when the lib reconnects to YouTube. Usually after the execution of the `reconnect()` methods.

##### Usage
```javascript
chat.on('reconnected', () => ... )
```


### `polling -> ()`
Emitted when the lib poll messages from YouTube.
/!\ This event is usually issued a lot of times in less than a second: if you perform too many operations, you risk running out of resources!

##### Usage
```javascript
chat.on('polling', () => ...)
```


### `tokens -> (tokens: Tokens)`
Emitted when the access token is refreshed.

##### Usage
```javascript
chat.on('tokens', (tokens) => ...)
```

##### Data structure
```typescript
{
    access_token?: string;
    token_type?: "Bearer" | string;
    expiry_date?: number;
}
```


### `error -> (error: Error)`
Emitted when an error occured.

##### Usage
```javascript
chat.on('error', (error) => ...)
```

##### How to handle errors
The error object is very VERY **VERY** big because it contains all the request and response !
But just a small part can be enough :happy:
```javascript
chat.on('error', (error) => {
    console.log(error.errors); // In this example, I faked the live chat ID to produce an error.
})
```
Let's take a look at the result:
```javascript
[
    {
        domain: 'youtube.liveChat',
        reason: 'liveChatNotFound',
        message: 'The live chat that you are trying to retrieve cannot be found. Check the value of the requests <code>liveChatId</code> parameter to ensure that it is correct.'
    }
]
```
With this [link](https://developers.google.com/youtube/v3/live/docs/errors) to help you, I think it's enough to understand how to handle errors :smiley:


### `chat -> (message: LiveChatMessage)`
Emitted when an user sent a message. (Pretty obvious...)

##### Usage
```javascript
chat.on('chat', (message) => ...)
```

##### Data structure
Take a look here : https://developers.google.com/youtube/v3/live/docs/liveChatMessages#resource



## Todo List

A checked item is considered as a *work in progress*.

- [x] Write unit tests
- [ ] Methods should return promises (but still support events)
- [ ] Add methods to get a Live Chat ID



Feel free to suggest features !

[![Feature Requests](http://feathub.com/siffreinsg/yt-livechat?format=svg)](http://feathub.com/siffreinsg/yt-livechat) [![Greenkeeper badge](https://badges.greenkeeper.io/siffreinsg/yt-livechat.svg)](https://greenkeeper.io/)



## Contributions

You're free to contribute by publishing pull requests, issues, ideas, ...

You can also [buy me a drink](https://paypal.me/siffreinsg) :heart:



