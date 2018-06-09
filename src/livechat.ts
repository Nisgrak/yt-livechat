import { EventEmitter } from "events";
import { Credentials } from "google-auth-library/build/src/auth/credentials";
import { OAuth2Client } from "google-auth-library/build/src/auth/oauth2client";
import { Config, LiveChatMessage } from "./types";

interface PollResp {
    data: {
        items: LiveChatMessage[];
    };
    pollingIntervalMillis: number;
    nextPageToken: string;
}

export class LiveChat extends EventEmitter {
    /**
     * OAuth2 client used to do authenticated requests.
     */
    public auth: OAuth2Client;
    /**
     * Config of the lib
     */
    public config: Config;
    /**
     * Equals true if the client is polling messages.
     */
    public connected: boolean = false;
    private knownMsgs: string[] = [];
    private pageToken: string | undefined = "";
    private pollTimeout: number;

    /**
     * Set config, create oauth client.
     * @param config Config of the lib
     */
    public constructor(config: Config) {
        super();
        this.config = config;
        this.auth = this.login();
    }

    /**
     * Create the oauth client
     */
    private login(): OAuth2Client {
        const {
            access_token,
            client_id,
            client_secret,
            refresh_token,
            expiry_date,
        } = this.config.oauth;

        const auth: OAuth2Client = new OAuth2Client(client_id, client_secret);
        auth.setCredentials({ access_token, refresh_token, expiry_date });
        auth.on("tokens", (tokens: Credentials) => this.emit("tokens", tokens));

        return auth;
    }

    /**
     * Start polling messages from the chat
     */
    public async connect(): Promise<this> {
        this.connected = true;
        this.emit("connected");
        this.poll();

        return this;
    }

    /**
     * Stop polling messages from the chat
     */
    public async disconnect(): Promise<this> {
        clearTimeout(this.pollTimeout);
        this.connected = false;
        this.emit("disconnected");

        return this;
    }

    /**
     * Recreate the oauth client, disconnect and reconnect to the chat.
     */
    public async reconnect(): Promise<this> {
        this.auth = this.login();
        await this.disconnect();
        await this.connect();
        this.emit("reconnected");

        return this;
    }

    /**
     * Send a message
     * @param message Message content
     */
    public say(message: string): Promise<LiveChatMessage> {
        return new Promise((resolve: (value: LiveChatMessage) => void, reject: (value: Error) => void): void => {
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
            }, (err: Error | null, res: { data: LiveChatMessage } | undefined | null) => {
                if (res && res.data) {
                    resolve(res.data);
                } else if (err) {
                    this.error(err);
                    reject(err);
                } else {
                    reject(new Error("Unknown error."));
                }
            });
        });
    }

    /**
     * Delete a message
     * @param messageId ID of the message
     */
    public delete(messageId: string): Promise<this> {
        return new Promise((resolve: (value: this) => void, reject: (value: Error) => void): void => {
            this.auth.request({
                method: "DELETE",
                params: {
                    id: messageId,
                },
                url: "https://www.googleapis.com/youtube/v3/liveChat/messages",
            }, (err: Error | null) => {
                if (!err) {
                    resolve(this);
                } else {
                    this.error(err);
                    reject(err);
                }
            });
        });
    }

    /**
     * Poll messages
     */
    private async poll(): Promise<void> {
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
        }, (err: Error | null, res: {} | PollResp | undefined | null) => {
            if (err) { this.error(err); }
            this.parse(res as PollResp | undefined | null);
        });
    }

    /**
     * Parse messages from the poll
     * @param resp Response of the poll request
     */
    private parse(resp: PollResp | null | undefined): this {
        if (resp && resp.data && resp.data.items) {
            if (this.knownMsgs.length > 0) {
                resp.data.items.forEach((item: LiveChatMessage) => {
                    if (this.knownMsgs.indexOf(item.id) === -1 && item.snippet.type === "textMessageEvent") {
                        this.knownMsgs.push(item.id);
                        this.emit("chat", item);
                    }
                });
            } else {
                this.knownMsgs = resp.data.items.map((msg: LiveChatMessage) => msg.id);
            }
        }

        const interval: number = !resp ? 10000 : Math.max(this.config.interval || 1, resp.pollingIntervalMillis);
        const pageToken: string | undefined = !resp ? undefined : resp.nextPageToken;
        if (this.pageToken !== pageToken) {
            this.pageToken = pageToken;
        }

        this.pollTimeout = setTimeout(this.poll.bind(this), interval);
        return this;
    }

    // TODO: Better error handler

    /**
     * Parse errors
     * @param err Error from any requests
     */
    private error(err: any): this { // tslint:disable-line:no-any
        this.emit("error", err);
        return this;
    }
}
