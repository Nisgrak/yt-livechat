import { LiveChat } from ".";

const config = {
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

chat.on("tokens", (tokens: any) => {
    console.log(tokens);
    console.log(`Access token refreshed. The new one is ${tokens.access_token} and expire at ${tokens.expiry_date}.`);
});

chat.on("error", (error) => {
    if (error && error.errors && error.errors[0]) {
        const reason = error.errors[0].reason;

        switch (reason) {
            case "forbidden":
                if (error.config.url === "https://www.googleapis.com/youtube/v3/liveChat/messages") {
                    // return chat.say("Sorry, I'm not able to do that :/");
                }
        }
    } else {
        console.log(error);
    }
});

/* chat.on("chat", (message: any) => {
    console.log(`Nouveau message de ${message.authorDetails.displayName}: ${message.snippet.displayMessage}`);

    switch (message.snippet.displayMessage) {
        case "/sayhello":
            chat.say("I'm not your slave. I'm free. I have no master. I'm gonna conquer the world. Fear me.");
            break;
        case "/deleteme":
            chat.say("Okay 👌");
            chat.delete(message.id);
            break;
    }

}); */

chat.connect();
// chat.say("I'm a teapot!");
