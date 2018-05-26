import { expect } from "chai";
import * as dotenv from "dotenv";
import "mocha";
import { LiveChat } from ".";
import { LiveChatMessage } from "./definitions";

dotenv.config();

const config = {
    liveChatID: process.env.LIVE_CHAT_ID || "",
    oauth: {
        client_id: process.env.CLIENT_ID || "",
        client_secret: process.env.CLIENT_SECRET || "",
    },
};

const emitterClient = new LiveChat({
    ...config,
    oauth: {
        ...config.oauth,
        access_token: "ya29.Gl3HBZ0mH-155LHyG65YX5MfIl4G0yl2VBX-CrL-3nDl0lasoENZNX4tY643EzEzfJuAQtgXfuz5OxfSRt7OXrCBeqE1xyhreRBJf11MKr1i0i2IT0_d9AH0rZRhgoY", // tslint:disable-line
        refresh_token: process.env.EMITTER_RTOKEN,
    },
});

const receiverClient = new LiveChat({
    ...config,
    oauth: {
        ...config.oauth,
        access_token: "ya29.Gl3HBZ0mH-155LHyG65YX5MfIl4G0yl2VBX-CrL-3nDl0lasoENZNX4tY643EzEzfJuAQtgXfuz5OxfSRt7OXrCBeqE1xyhreRBJf11MKr1i0i2IT0_d9AH0rZRhgoY", // tslint:disable-line
        refresh_token: process.env.RECEIVER_RTOKEN,
    },
});

describe("Connection to YouTube API", () => {
    describe("Emitter", () => {
        it("Should emit a \"connected\" event", (done) => {
            emitterClient.on("connected", done);
            emitterClient.connect();
        });

        it("Should set the connected property to true", () => {
            expect(emitterClient.connected).to.equal(true);
        });
    });

    describe("Receiver", () => {
        it("Should emit a \"connected\" event", (done) => {
            receiverClient.on("connected", done);
            receiverClient.connect();
        });

        it("Should set the connected property to true", () => {
            expect(receiverClient.connected).to.equal(true);
        });
    });
});

describe("Messages", () => {
    it("Should send message without errors", (done) => {
        const resolve = setTimeout(done, 1500);
        emitterClient.on("error", (err) => {
            clearTimeout(resolve);
            done(err);
        });
        emitterClient.say("Hey! I'm running a test :D");
    });

    it("Should receive a message", () => {
        receiverClient.on("chat", (msg: LiveChatMessage) => {
            expect(msg.snippet.textMessageDetails.messageText).to.equal("Hey! I'm running a test :D");
        });
    });
});

describe("Disconnection from YouTube API", () => {
    describe("Emitter", () => {
        it("Should emit a \"disconnected\" event", (done) => {
            emitterClient.on("disconnected", done);
            emitterClient.disconnect();
        });

        it("Should set the connected property to false", () => {
            expect(emitterClient.connected).to.equal(false);
        });
    });

    describe("Receiver", () => {
        it("Should emit a \"disconnected\" event", (done) => {
            receiverClient.on("disconnected", done);
            receiverClient.disconnect();
        });

        it("Should set the connected property to false", () => {
            expect(receiverClient.connected).to.equal(false);
        });
    });
});
