import { EventEmitter } from "events";
import { Credentials } from "google-auth-library/build/src/auth/credentials";
import { OAuth2Client } from "google-auth-library/build/src/auth/oauth2client";
import { Config, LiveChatMessage } from "./types";

export class LiveChat extends EventEmitter {
    /**
     * Equals true if the client is polling messages.
     */
    public connected: boolean = false;

    /**
     * OAuth2 client used to do authenticated requests.
     */
    public auth: OAuth2Client;
    private pollTimeout: any;
    private pageToken: string = "";
    private knownMsgs: string[] = [];

    /**
     * Set config, create oauth client.
     * @param {Config} config Class config
     */
    constructor(public config: Config) {
        super();
        this.auth = this.login();
    }

    /**
     * Start polling messages from the chat
     */
    public async connect() {
        this.connected = true;
        this.emit("connected");
        this.poll();
        return this;
    }

    /**
     * Stop polling messages from the chat
     */
    public async disconnect() {
        clearTimeout(this.pollTimeout);
        this.connected = false;
        this.emit("disconnected");
        return this;
    }

    /**
     * Recreate the oauth client, disconnect and reconnect to the chat.
     */
    public async reconnect() {
        this.auth = this.login();
        await this.disconnect();
        await this.connect();
        this.emit("reconnected");
        return this;
    }

    /**
     * Send a message
     * @param {string} message Message content
     */
    public say(message: string): Promise<LiveChatMessage> {
        return new Promise((resolve, reject) => {
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
            }, (err: any, res: any) => {
                if (err) {
                    this.error(err);
                    return reject(err);
                }
                resolve(res.data);
            });
        });
    }

    /**
     * Delete a message
     * @param messageId ID of the message
     */
    public delete(messageId: string) {
        return new Promise((resolve, reject) => {
            this.auth.request({
                method: "DELETE",
                params: {
                    id: messageId,
                },
                url: "https://www.googleapis.com/youtube/v3/liveChat/messages",
            }, (err: any) => {
                if (err) {
                    this.error(err);
                    return reject(err);
                }
                resolve();
            });
        });
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

        const auth = new OAuth2Client(client_id, client_secret);
        auth.setCredentials({ access_token, refresh_token, expiry_date });
        auth.on("tokens", (tokens: Credentials) => this.emit("tokens", tokens));
        return auth;
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
        }, (err: any, res: any) => {
            if (err) {
                this.error(err);
                return this.parse(undefined);
            }
            this.parse(res);
        });
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
        if (!err.errors || !err.errors || !err.errors[0]) {
            this.emit("error", err);
            return this;
        }
        const reason = err.errors[0].reason;

        switch (reason) {
            case "authError":
                this.refreshAuth();
                break;
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
