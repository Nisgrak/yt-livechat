export interface Config {
    oauth: Oauth2Config;
    liveChatID: string;
    /**
     * Force the time interval in ms between each poll.
     */
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

/*
The following definitions have been extracted from https://google.github.io/google-api-nodejs-client/
and have been adapted to the current software.
They are subject to the Apache 2.0 license as defined by this copyright from the same URL:

 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/

export interface LiveChatMessage {
    /**
     * The authorDetails object contains basic details about the user that posted
     * this message.
     */
    authorDetails: LiveChatMessageAuthorDetails;
    /**
     * Etag of this resource.
     */
    etag: string;
    /**
     * The ID that YouTube assigns to uniquely identify the message.
     */
    id: string;
    /**
     * Identifies what kind of resource this is. Value: the fixed string
     * &quot;youtube#liveChatMessage&quot;.
     */
    kind: string;
    /**
     * The snippet object contains basic details about the message.
     */
    snippet: LiveChatMessageSnippet;
}
export interface LiveChatMessageAuthorDetails {
    /**
     * The YouTube channel ID.
     */
    channelId: string;
    /**
     * The channel's URL.
     */
    channelUrl: string;
    /**
     * The channel's display name.
     */
    displayName: string;
    /**
     * Whether the author is a moderator of the live chat.
     */
    isChatModerator: boolean;
    /**
     * Whether the author is the owner of the live chat.
     */
    isChatOwner: boolean;
    /**
     * Whether the author is a sponsor of the live chat.
     */
    isChatSponsor: boolean;
    /**
     * Whether the author's identity has been verified by YouTube.
     */
    isVerified: boolean;
    /**
     * The channels's avatar URL.
     */
    profileImageUrl: string;
}

export interface LiveChatMessageSnippet {
    /**
     * The ID of the user that authored this message, this field is not always
     * filled. textMessageEvent - the user that wrote the message fanFundingEvent
     * - the user that funded the broadcast newSponsorEvent - the user that just
     * became a sponsor messageDeletedEvent - the moderator that took the action
     * messageRetractedEvent - the author that retracted their message
     * userBannedEvent - the moderator that took the action superChatEvent - the
     * user that made the purchase
     */
    authorChannelId: string;
    /**
     * Contains a string that can be displayed to the user. If this field is not
     * present the message is silent, at the moment only messages of type
     * TOMBSTONE and CHAT_ENDED_EVENT are silent.
     */
    displayMessage: string;
    /**
     * Details about the funding event, this is only set if the type is
     * 'fanFundingEvent'.
     */
    fanFundingEventDetails: LiveChatFanFundingEventDetails;
    /**
     * Whether the message has display content that should be displayed to users.
     */
    hasDisplayContent: boolean;
    liveChatId: string;
    messageDeletedDetails: LiveChatMessageDeletedDetails;
    messageRetractedDetails: LiveChatMessageRetractedDetails;
    pollClosedDetails: LiveChatPollClosedDetails;
    pollEditedDetails: LiveChatPollEditedDetails;
    pollOpenedDetails: LiveChatPollOpenedDetails;
    pollVotedDetails: LiveChatPollVotedDetails;
    /**
     * The date and time when the message was orignally published. The value is
     * specified in ISO 8601 (YYYY-MM-DDThh:mm:ss.sZ) format.
     */
    publishedAt: string;
    /**
     * Details about the Super Chat event, this is only set if the type is
     * 'superChatEvent'.
     */
    superChatDetails: LiveChatSuperChatDetails;
    /**
     * Details about the text message, this is only set if the type is
     * 'textMessageEvent'.
     */
    textMessageDetails: LiveChatTextMessageDetails;
    /**
     * The type of message, this will always be present, it determines the
     * contents of the message as well as which fields will be present.
     */
    type: string;
    userBannedDetails: LiveChatUserBannedMessageDetails;
}

export interface LiveChatFanFundingEventDetails {
    /**
     * A rendered string that displays the fund amount and currency to the user.
     */
    amountDisplayString: string;

    /**
     * The amount of the fund.
     */
    amountMicros: string;
    /**
     * The currency in which the fund was made.
     */
    currency: string;
    /**
     * The comment added by the user to this fan funding event.
     */
    userComment: string;
}

export interface LiveChatMessageDeletedDetails {
    deletedMessageId: string;
}

export interface LiveChatMessageRetractedDetails {
    retractedMessageId: string;
}

export interface LiveChatPollClosedDetails {
    /**
     * The id of the poll that was closed.
     */
    pollId: string;
}
export interface LiveChatPollEditedDetails {
    id: string;
    items: LiveChatPollItem[];
    prompt: string;
}
export interface LiveChatPollItem {
    /**
     * Plain text description of the item.
     */
    description: string;
    itemId: string;
}
export interface LiveChatPollOpenedDetails {
    id: string;
    items: LiveChatPollItem[];
    prompt: string;
}
export interface LiveChatPollVotedDetails {
    /**
     * The poll item the user chose.
     */
    itemId: string;
    /**
     * The poll the user voted on.
     */
    pollId: string;
}

export interface LiveChatSuperChatDetails {
    /**
     * A rendered string that displays the fund amount and currency to the user.
     */
    amountDisplayString: string;
    /**
     * The amount purchased by the user, in micros (1,750,000 micros = 1.75).
     */
    amountMicros: string;
    /**
     * The currency in which the purchase was made.
     */
    currency: string;
    /**
     * The tier in which the amount belongs to. Lower amounts belong to lower
     * tiers. Starts at 1.
     */
    tier: number;
    /**
     * The comment added by the user to this Super Chat event.
     */
    userComment: string;
}
export interface LiveChatTextMessageDetails {
    /**
     * The user's message.
     */
    messageText: string;
}
export interface LiveChatUserBannedMessageDetails {
    /**
     * The duration of the ban. This property is only present if the banType is
     * temporary.
     */
    banDurationSeconds: string;
    /**
     * The details of the user that was banned.
     */
    bannedUserDetails: ChannelProfileDetails;
    /**
     * The type of ban.
     */
    banType: string;
}

export interface ChannelProfileDetails {
    /**
     * The YouTube channel ID.
     */
    channelId: string;
    /**
     * The channel's URL.
     */
    channelUrl: string;
    /**
     * The channel's display name.
     */
    displayName: string;
    /**
     * The channels's avatar URL.
     */
    profileImageUrl: string;
}
