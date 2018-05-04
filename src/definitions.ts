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
export interface LiveChatMsg {
    author: LiveChatAuthor;
    content: string;
    id: string;
    liveChatId: string;
    publishedAt: string;
}
export interface LiveChatAuthor {
    channelId: string;
    isChatModerator: boolean;
    isChatOwner: boolean;
    isChatSponsor: boolean;
    isVerified: boolean;
    name: string;
    profileImageUrl: string;
}
