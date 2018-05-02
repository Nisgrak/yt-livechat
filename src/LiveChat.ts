import { EventEmitter } from "events";
import { google } from "googleapis";
import { IConfig, ILiveChatMsg } from "./definitions";

const OAuth2 = google.auth.OAuth2;
const YouTube = google.youtube("v3");

export class LiveChat extends EventEmitter {
    public connected: boolean = false;
    private auth: any;
    private pollTimeout: any;
    private pageToken: string = "";
    private knownMsgs: string[] = [];

    constructor(public config: IConfig) { super(); }

    public connect() {
        // tslint:disable-next-line
        const { accessToken: access_token, clientID, clientSecret, refreshToken: refresh_token } = this.config.oauth;
        this.auth = new OAuth2(clientID, clientSecret);
        this.auth.setCredentials({ access_token, refresh_token });

        this.connected = true;
        this.emit("connected");
        this.poll();
    }

    public disconnect() {
        clearTimeout(this.pollTimeout);
        this.pollTimeout = null;
        this.connected = false;
        this.emit("disconnected");
    }

    public reconnect() {
        this.disconnect();
        this.connect();
        this.emit("reconnected");
    }

    public say(message: string) {
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
    }

    public delete(msgID: string) {
        YouTube.liveChatMessages.delete({ auth: this.auth, id: msgID })
            .catch((err: any) => this.emit("error", err));
    }

    private poll() {
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
    }

    private parse(resp: any) {
        if (this.knownMsgs.length > 0) {
            resp.data.items.forEach((item: any) => {
                if (this.knownMsgs.indexOf(item.id) === -1 && item.snippet.type === "textMessageEvent") {
                    const msg: ILiveChatMsg = {
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
    }

    private refreshAuth() {
        this.emit("refreshing");
        this.auth.refreshAccessToken((error: any, token: string) => {
            if (error) {
                return this.emit("error", error);
            }
            this.config.oauth.refreshToken = token;
            this.emit("auth_refreshed");
        });
    }
}
