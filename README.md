# YouTube Stream Filter

## About
The add-on modifies the YouTube live-chat for both live-streams and re-play, allowing to either highlight or delete chat-messages matching a set of adjustable filter rules.

For highlighting chat-messages, the YouTube live-chat is separated vertically into two live-chats. The upper one is the original one, while the lower one displays chat-messages you may filter for. The sizes of the chat-boxes are adjustable via dragging the separator line between the chat-boxes up or down. The highlight chat-box is removable via the settings page and the YouTube live-chat drop-down menu.

The add-on settings-page allows to set one or several filter rules. The filter rules search either the author-name or the message of a chat-message for search-texts. When a filter rule matches a chat-message, it will be either highlighted or removed, where rules higher up in the filter rule list are applied first. The filter rules are draggable up or down the list. Furthermore, Regular Expressions are available as filters when enabling the expert mode.

The settings are preset to highlight for common chat-based English translations of Japanese Hololive streams (at least the ones I watch).

This add-on is at its first version, and may contain some bugs. Please write me if you encounter some bugs or you would like some features to be implemented. Right now, it is more of a fun-project, but I may improve it further when there is interest in this add-on.

## Installation
### Mozilla Firefox
For using the storage API make sure, that for manifest.json the "id" is set with an e-mail address:

"browser_specific_settings": {
    "gecko": {
        "id": "youtube_stream_highlighter@example.com"
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