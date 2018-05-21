import { EventEmitter } from "events";
import { OAuth2Client } from "google-auth-library";
import { Config, LiveChatMessage } from "./definitions";

export class LiveChat extends EventEmitter {
    public connected: boolean = false;
    public auth: OAuth2Client;
    private pollTimeout: any;
    private pageToken: string = "";
    private knownMsgs: string[] = [];

    /**
     * Set config, init events, create oauth client
     * @param {Config} config Class config
     */
    constructor(public config: Config) {
        super();
        this.auth = this.login();
    }

    /**
     * Start polling messages from the chat
     */
    public connect(): this {
        this.connected = true;
        this.emit("connected");
        this.poll();
        return this;
    }

    /**
     * Stop polling messages from the chat
     */
    public disconnect(): this {
        clearTimeout(this.pollTimeout);
        this.connected = false;
        this.emit("disconnected");
        return this;
    }

    /**
     * Recreate the oauth client, disconnect and reconnect to the chat.
     */
    public reconnect(): this {
        this.auth = this.login();
        this.disconnect()
            .connect()
            .emit("reconnected");
        return this;
    }

    /**
     * Send a message
     * @param {string} message Message content
     */
    public say(message: string): this {
        this.auth.request({
            data: {
                snippet: {
                    liveChatId: this.config.liveChatID,
                    textMessageDetails: {
                        messageText: message,
                    },
                    type: "textMessageEvent",
                },
            },
            method: "POST",
            params: {
                part: "snippet",
            },
            url: "https://www.googleapis.com/youtube/v3/liveChat/messages",
        }).catch((err) => this.error.bind(this, err)());
        return this;
    }

    /**
     * Delete a message
     * @param messageId ID of the message
     */
    public delete(messageId: string): this {
        this.auth.request({
            method: "DELETE",
            params: {
                id: messageId,
            },
            url: "https://www.googleapis.com/youtube/v3/liveChat/messages",
        }).catch((err) => this.error.bind(this, err)());
        return this;
    }

    /**
     * Create the oauth client
     */
    private login() {
        const {
            access_token,
            client_id,
            client_secret,
            refresh_token,
            expiry_date,
        } = this.config.oauth;

        const client = new OAuth2Client(client_id, client_secret);
        client.setCredentials({ access_token, refresh_token, expiry_date });
        client.on("tokens", (tokens: any) => this.emit("tokens", tokens));
        return client;
    }

    /**
     * Poll messages
     */
    private async poll() {
        this.emit("polling");

        this.auth.request({
            method: "GET",
            params: {
                liveChatId: this.config.liveChatID,
                maxResults: 2000,
                pageToken: this.pageToken,
                part: "snippet, authorDetails",
            },
            url: "https://www.googleapis.com/youtube/v3/liveChat/messages",
        }).then((res) => {
            this.parse.bind(this, res)();
        }).catch((err) => {
            this.error.bind(this, err)();
            this.parse.bind(this, undefined)();
        });
        return this;
    }

    /**
     * Parse messages from the poll
     * @param resp Response of the poll request
     */
    private parse(resp: any): this {
        if (resp && resp.data && resp.data.items) {
            if (this.knownMsgs.length > 0) {
                resp.data.items.forEach((item: any) => {
                    if (this.knownMsgs.indexOf(item.id) === -1 && item.snippet.type === "textMessageEvent") {
                        this.knownMsgs.push(item.id);
                        this.emit("chat", item);
                    }
                });
            } else {
                this.knownMsgs = resp.data.items.map((msg: LiveChatMessage) => msg.id);
            }
        }

        const interval = !resp ? 10000 : Math.max(this.config.interval || 1, resp.pollingIntervalMillis);
        const pageToken = !resp ? undefined : resp.nextPageToken;
        if (this.pageToken !== pageToken) {
            this.pageToken = pageToken;
        }

        this.pollTimeout = setTimeout(this.poll.bind(this), interval);
        return this;
    }

    /**
     * Parse errors
     * @param err Error from any requests
     */
    private error(err: any): this {
        if (!err.errors || err.errors || !err.errors[0]) {
            this.emit("error", err);
            return this;
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
                this.emit("error", err);
        }
        return this;
    }

    /**
     * Refresh OAuth tokens
     */
    private refreshAuth(): this {
        this.auth.refreshAccessToken();
        return this;
    }
}
