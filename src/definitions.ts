export interface Config {
    oauth: Oauth2Config;
    liveChatID: string;
    interval?: number | null;
}

export interface Oauth2Config extends Tokens {
    client_id?: string;
    client_secret?: string;
    refresh_token?: string | null;
}

export interface Tokens {
    access_token?: string;
    token_type?: "Bearer" | string;
    expiry_date?: number;
}
