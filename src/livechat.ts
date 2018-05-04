import { EventEmitter } from "events";
import { google } from "googleapis";
import { Config, LiveChatMsg } from ".";

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
            resource: {
                snippet: {
                    liveChatId: this.config.liveChatID,
                    textMessageDetails: {
                        messageText: message,
                    },
                    type: "textMessageEvent",
                },
            },
        }).catch((err: any) => this.emit("error", err));
        return this;
    }

    public delete(messageID: string): this {
        YouTube.liveChatMessages.delete({ auth: this.auth, id: messageID })
            .catch((err: any) => this.emit("error", err));
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
        })
            .then((resp) => this.parse.bind(this, resp)())
            .catch((err) => {
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
                    default:
                        return this.emit("error", err);
                }
                this.parse.bind(this, undefined)();
            });
        return this;
    }

    private parse(resp: any): this {
        if (this.knownMsgs.length > 0) {
            resp.data.items.forEach((item: any) => {
                if (this.knownMsgs.indexOf(item.id) === -1 && item.snippet.type === "textMessageEvent") {
                    const msg: LiveChatMsg = {
                        author: {
                            channelId: item.snippet.authorChannelId,
                            isChatModerator: item.authorDetails.isChatModerator,
                            isChatOwner: item.authorDetails.isChatOwner,
                            isChatSponsor: item.authorDetails.isChatSponsor,
                            isVerified: item.authorDetails.isVerified,
                            name: item.authorDetails.displayName,
                            profileImageUrl: item.authorDetails.profileImageUrl,
                        },
                        content: item.snippet.displayMessage,
                        id: item.id,
                        liveChatId: item.snippet.liveChatId,
                        publishedAt: item.snippet.publishedAt,
                    };

                    this.knownMsgs.push(msg.id);
                    this.emit("chat", msg);
                }
            });
        } else {
            this.knownMsgs = resp.data.items.map((msg: any) => msg.id);
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
