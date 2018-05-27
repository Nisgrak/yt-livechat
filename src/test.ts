import { expect } from "chai";
import * as dotenv from "dotenv";
import "mocha";
import { LiveChat } from ".";
import { LiveChatMessage } from "./types";

dotenv.config();

const config = {
    liveChatID: process.env.LIVE_CHAT_ID || "",
    oauth: {
        client_id: process.env.CLIENT_ID || "",
        client_secret: process.env.CLIENT_SECRET || "",
    },
};

const userClient = new LiveChat({
    ...config,
    oauth: {
        ...config.oauth,
        access_token: process.env.USER_ATOKEN,
        refresh_token: process.env.USER_RTOKEN,
    },
});

const modClient = new LiveChat({
    ...config,
    oauth: {
        ...config.oauth,
        access_token: process.env.MOD_ATOKEN,
        refresh_token: process.env.MOD_RTOKEN,
    },
});

describe("Connection to YouTube API", () => {
    describe("User", () => {
        it("Should emit a \"connected\" event", (done) => {
            userClient.on("connected", done);
            userClient.connect();
        });

        it("Should set the connected property to true", () => {
            expect(userClient.connected).to.equal(true);
        });
    });

    describe("Moderator", () => {
        it("Should also return a promise", (done) => {
            modClient.connect()
                .then(() => done())
                .catch(done);
        });

        it("Should set the connected property to true", () => {
            expect(modClient.connected).to.equal(true);
        });
    });
});

describe("Messages", () => {
    it("Should send message without errors", (done) => {
        userClient.say("Hello world!")
            .then(() => done())
            .catch(done);
    });

    it("Should receive the message", (done) => {
        userClient.on("chat", () => {
            done();
        });
    });

    it("Should delete the message", (done) => {
        modClient.on("chat", (msg: LiveChatMessage) => {
            modClient.delete(msg.id)
                .then(() => done())
                .catch(done);
        });
    });
});

describe("Disconnection from YouTube API", () => {
    describe("Emitter", () => {
        it("Should emit a \"disconnected\" event", (done) => {
            userClient.on("disconnected", done);
            userClient.disconnect();
        });

        it("Should set the connected property to false", () => {
            expect(userClient.connected).to.equal(false);
        });
    });

    describe("Receiver", () => {
        it("Should also return a promise", (done) => {
            modClient.disconnect().then(() => done());
        });

        it("Should set the connected property to false", () => {
            expect(modClient.connected).to.equal(false);
        });
    });
});
