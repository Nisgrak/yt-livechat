# LiveChecker

Small library to interact with the YouTube and Twitch Streaming APIs.
For now you can only check if a YouTube channel or a Twitch user is streaming. In the future you should be able to interact with the complete APIs.

## Installation

```bash
$ npm install livechecker --save
```

## Usage

The full documentation is available here : http://siffreinsg.github.io/LiveChecker
A fully documented example script will be available soon.

## Returned data

The YouTube checker returns a boolean or the same data as https://developers.google.com/youtube/v3/docs/search/list#response
The Twitch checker returns the same data as https://dev.twitch.tv/docs/v5/reference/streams#get-stream-by-user

## ToDo

- Integrate the full YouTube Stream API
- Integrate the full Twitch Stream API

## Release History

- 1.1.0 Method added (check if a channel/user exists)
- 1.0.1 Updated README
- 1.0.0 Initial release
