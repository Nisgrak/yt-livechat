export interface Config {
    oauth: OauthConfig;
    liveChatID: string;
    interval?: number;
}
export interface OauthConfig {
    accessToken?: string;
    clientID: string;
    clientSecret: string;
    refreshToken: string;
    expiryDate?: string;
}
