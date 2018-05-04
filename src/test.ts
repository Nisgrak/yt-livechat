import { LiveChat, LiveChatMsg } from ".";

const config = {
    liveChatID: process.env.LIVE_CHAT_ID || "",
    oauth: {
        clientID: process.env.CLIENT_ID || "",
        clientSecret: process.env.CLIENT_SECRET || "",
        refreshToken: process.env.REFRESH_TOKEN || "",
    },
};

console.log("Config from .env file:\n" + JSON.stringify(config, null, 4));
const chat: LiveChat = new LiveChat(config);

chat.on("connected", () => console.log("Connected to the YouTube API."));
chat.on("polling", () => console.log("Polling new messages."));
// tslint:disable-next-line
chat.on("token_refreshed", (tokens: any) => console.log(`Access token refreshed. The new one is ${tokens.access_token} and expire at ${tokens.expiry_date}.`));
chat.on("refreshing", () => console.log("Refreshing access token..."));
chat.on("error", (error) => {
    if (error && error.errors[0]) {
        const reason = error.errors[0].reason;

        switch (reason) {
            case "forbidden":
                if (error.config.url === "https://www.googleapis.com/youtube/v3/liveChat/messages") {
                    return chat.say("Sorry, I'm not able to do that :/");
                }
        }
    }
});

chat.on("chat", (message: LiveChatMsg) => {
    console.log(`Nouveau message de ${message.author.name}: ${message.content}`);

    switch (message.content) {
        case "/sayhello":
            chat.say("I'm not your slave. I'm free. I have no master. I'm gonna conquer the world. Fear me.");
            break;
        case "/deleteme":
            chat.say("Okay 👌");
            chat.delete(message.id);
            break;
    }
});

chat.connect();
chat.say("I'm a teapot!");
