import { LiveChat } from ".";
import { LiveChatMessage } from "./definitions";

const config = {
    interval: 10000,
    liveChatID: process.env.LIVE_CHAT_ID || "",
    oauth: {
        client_id: process.env.CLIENT_ID || "",
        client_secret: process.env.CLIENT_SECRET || "",
        refresh_token: process.env.REFRESH_TOKEN || "",
    },
};

const chat = new LiveChat(config);

chat.on("connected", () => console.log("Connected to the YouTube API."))
    .on("polling", () => console.log("Polling new messages."))
    .on("tokens", () => console.log("Access token refreshed."));

chat.on("error", (error) => {
    if (error && error.errors && error.errors[0]) {
        const err = error.errors[0];

        switch (err.reason) {
            case "forbidden":
                console.error(`[ERROR] ${err.message}`);
                break;
            case "liveChatNotFound":
                console.error(`[ERROR] ${err.message}`);
                process.exit(1);
                break;
            default:
                console.log(err);
        }
    } else {
        console.log(error);
    }
});

chat.on("chat", (message: LiveChatMessage) => {
    console.log(`New message from ${message.authorDetails.displayName}: ${message.snippet.displayMessage}`);

    switch (message.snippet.displayMessage) {
        case "/sayhello":
            chat.say("I'm not your slave, I'm free. I don't have any master. I'm gonna conquer this world. Fear me!!!");
            break;
        case "/deleteme":
            if (!message.authorDetails.isChatModerator && !message.authorDetails.isChatOwner) {
                chat.say("Okay 👌");
                chat.delete(message.id);
            } else {
                chat.say("Sorry but I can't do that :(");
            }
            break;
    }

});

chat.connect();
chat.say("I'm a teapot!");
