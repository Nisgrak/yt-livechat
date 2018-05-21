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

console.log("Config from .env file:\n" + JSON.stringify(config, null, 4));
const chat = new LiveChat(config);

chat.on("connected", () => console.log("Connected to the YouTube API."));
chat.on("polling", () => console.log("Polling new messages."));
chat.on("tokens", () => console.log(`Access token refreshed.`));

chat.on("error", (error) => {
    if (error && error.errors && error.errors[0]) {
        const reason = error.errors[0].reason;

        switch (reason) {
            case "forbidden":
                break;
            default:
                console.log(error);
        }
    } else {
        console.log(error);
    }
});

chat.on("chat", (message: LiveChatMessage) => {
    console.log(`Nouveau message de ${message.authorDetails.displayName}: ${message.snippet.displayMessage}`);

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
