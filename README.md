# YouTube Stream Filter


## About
The add-on modifies the YouTube live-chat for both live-streams and re-play, allowing to either highlight, show as video captions, or delete chat-messages matching a set of customizable filter rules. This is usefull e.g. for highlighting Hololive live-chat translator messages, or deleting annoying messages and emoji.

The main features of the add-on are:
- Highlighting of YouTube live-chat messages via a separated chat-box
- View selected highlighted live-chat messages as video player captions
- Deleting YouTube live-chat messages
- Customizable filter rules, allowing to either enter simple search-texts, or to use more complex options (e.g. Regular Expressions)
- Light- and Dark-theme support
- When changing filter rules at the settings page, the settings are immediately applied to opened YouTube pages
- Visual design close to YouTube's live-chat and video player design, aiming to not change the look of the YouTube website

More detailed description of add-on features:

For highlighting chat-messages, the YouTube live-chat is separated vertically into two live-chats. The upper one is the original one, while the lower one displays chat-messages you may filter for. The sizes of the chat-boxes are adjustable via dragging the separator line between the chat-boxes up or down. The highlight chat-box is removable via the settings page and the YouTube live-chat drop-down menu.

Furthermore, it is possible to view chat-messages from some filter rules as video player captions. If the chat-message is a translator chat-message, e.g. starting with [EN] for English, the translator tag [EN] is not displayed for a more immersive viewing experience. 

The add-on settings-page allows to set one or several filter rules. The filter rules search either the author-name or the message of a chat-message for search-texts. When a filter rule matches a chat-message, it will be either highlighted or removed, where rules higher up in the filter rule list are applied first. The filter rules are draggable up or down the list. Furthermore, Regular Expressions are available as filters when enabling the expert mode. The expert mode further enables a validation window, for validating if a filter rule matches example YouTube live-chat authors and messages.

The settings are preset to highlight for common chat-based English translations of Japanese Hololive streams (at least the ones I watch). If you want to add new translator filter rules, add a new filter rule and then set as the search-text the language code within [] brackets. This is [EN] for English, [DE] for German, [JP] for Japanese, and similar for other languages.

Please write me if you encounter some bugs or you would like some features to be implemented, by opening an Issue at the GitHub page https://github.com/MengeTM/Filter-For-YouTube-Live-Chats/issues of this add-on.

## Installation
Before installing the add-on, rename either "manifes_mozilla.json" for Mozilla Firefox, or "manifest_goofle.json" for Google Chrome in "manifes.json".
### Mozilla Firefox
For using the storage API make sure, that for manifest.json the "id" is set with an e-mail address:

"browser_specific_settings": {
    "gecko": {
        "id": "youtube_stream_filter@example.com"
    }
}

1. Open Firefox Browser
2. Open page "about:debugging"
3. Click "This Firefox"
4. Click on "Load Temporary Add-On"
5. Select manifest.json

### Google Chrome
1. Open Chrome Browser
2. Open page "chrome://extensions"
3. Activate "Developer mode"
4. Click "Load unpacked"
5. Select folder with manifest.json