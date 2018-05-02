export interface IConfig {
    oauth: IConfigOauth;
    liveChatID: string;
    interval?: number;
}

export interface IConfigOauth {
    accessToken?: string;
    clientID: string;
    clientSecret: string;
    refreshToken: string;
}

export interface ILiveChatMsg {
    author: ILiveChatAuthor;
    content: string;
    id: string;
    liveChatId: string;
    publishedAt: string;
}

export interface ILiveChatAuthor {
    channelId: string;
    isChatModerator: boolean;
    isChatOwner: boolean;
    isChatSponsor: boolean;
    isVerified: boolean;
    name: string;
    profileImageUrl: string;
}
