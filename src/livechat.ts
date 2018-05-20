import { EventEmitter } from "events";
import { google, youtube_v3 } from "googleapis";
import { Config } from ".";

const OAuth2 = google.auth.OAuth2;
const YouTube = google.youtube("v3");

export class LiveChat extends EventEmitter {
    public connected: boolean = false;
    private auth: any;
    private pollTimeout: any;
    private pageToken: string = "";
    private knownMsgs: string[] = [];

    constructor(public config: Config) { super(); }

    public connect(): this {
        // tslint:disable:variable-name
        const {
            accessToken: access_token,
            clientID,
            clientSecret,
            refreshToken: refresh_token,
            expiryDate: expiry_date,
        } = this.config.oauth;

        this.auth = new OAuth2(clientID, clientSecret);
        this.auth.setCredentials({ access_token, refresh_token, expiry_date });

        const that = this;
        this.auth.on("tokens", (tokens: any) => that.emit("token_refreshed", tokens));

        this.connected = true;
        this.emit("connected");
        this.poll();
        return this;
    }

    public disconnect(): this {
        clearTimeout(this.pollTimeout);
        this.pollTimeout = null;
        this.connected = false;
        this.emit("disconnected");
        return this;
    }

    public reconnect(): this {
        this.disconnect()
            .connect()
            .emit("reconnected");
        return this;
    }

    public say(message: string): this {
        YouTube.liveChatMessages.insert({
            auth: this.auth,
            part: "snippet",
            requestBody: {
                snippet: {
                    liveChatId: this.config.liveChatID,
                    textMessageDetails: {
                        messageText: message,
                    },
                    type: "textMessageEvent",
                },
            },
        }, (err: Error | null) => {
            if (err) {
                this.emit("error", err);
            }
        });
        return this;
    }

    public delete(messageID: string): this {
        YouTube.liveChatMessages.delete({
            auth: this.auth,
            id: messageID,
        }, (err: Error | null) => {
            if (err) {
                this.emit("error", err);
            }
        });
        return this;
    }

    private poll(): this {
        this.emit("polling");
        YouTube.liveChatMessages.list({
            auth: this.auth,
            liveChatId: this.config.liveChatID,
            maxResults: 2000,
            pageToken: this.pageToken,
            part: "snippet, authorDetails",
        }).then((resp) => this.parse.bind(this, resp)())
            .catch((err: any) => {
                if (!err.errors || !err.errors[0]) {
                    return this.emit("error", err);
                }
                const reason = err.errors[0].reason;

                switch (reason) {
                    case "authError":
                        this.refreshAuth();
                        break;
                    case "forbidden":
                    case "liveChatDisabled":
                    case "liveChatEnded":
                    case "liveChatNotFound":
                    case "rateLimitExceeded":
                    case "quotaExceeded":
                    default:
                        return this.emit("error", err);
                }
                return this.parse.bind(this, undefined)();
            });
        return this;
    }

    private parse(resp: any): this {
        if (this.knownMsgs.length > 0) {
            resp.data.items.forEach((item: youtube_v3.Schema$LiveChatMessage) => {
                if (this.knownMsgs.indexOf("" + item.id) === -1 && item.snippet && item.snippet.type === "textMessageEvent") { // tslint:disable
                    this.knownMsgs.push("" + item.id);
                    this.emit("chat", item);
                }
            });
        } else {
            this.knownMsgs = resp.data.items.map((msg: youtube_v3.Schema$LiveChatMessage) => msg.id);
        }

        const interval = !resp ? 10000 : Math.max(this.config.interval || 1, resp.pollingIntervalMillis);
        const pageToken = !resp ? undefined : resp.nextPageToken;
        if (this.pageToken !== pageToken) {
            this.pageToken = pageToken;
        }

        this.pollTimeout = setTimeout(this.poll.bind(this), interval);
        return this;
    }

    private refreshAuth(): this {
        this.auth.refreshAccessToken();
        return this;
    }
}
