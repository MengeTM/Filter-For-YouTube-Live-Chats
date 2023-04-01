# YouTube Stream Filter

## About
The add-on modifies the YouTube live-chat for both live-streams and re-play, allowing to either highlight, show as video captions, or delete chat-messages matching a set of customizable filter rules. This is useful e.g. for highlighting Hololive live-chat translator messages, or deleting annoying messages and emoji.

The main features of the add-on are:
<ul>
    <li>Highlighting of YouTube live-chat messages via a separated chat-box</li>
    <li>View selected highlighted live-chat messages as customizable subtitles for YouTube</li>
    <li>Delete YouTube live-chat messages</li>
    <li>Customizable filter rules, allowing to either enter simple search-texts, or to use more complex options (e.g. Regular Expressions)</li>
    <li>Light- and Dark-theme support</li>
    <li>When changing filter rules at the settings page, the settings are immediately applied to opened YouTube pages</li>
    <li>Visual design close to YouTube's live-chat and video player design, aiming to not change the look of the YouTube website</li>
</ul>

Experimental:
<ul>
    <li>Filter messages regarding characters of languages. E.g. show only YouTube Live-chat messages written with English characters. This works only English vs. Japanese or German vs. Japanese, not for German vs. English</li>
</ul>

If there are features or improvements for this add-on you'd like to suggest, please go to the GitHub page of this add-on https://github.com/MengeTM/Filter-For-YouTube-Live-Chats/issues for writing an Issue, or please leave a review for this add-on. I would really appreciate feedback and ideas, for how to further improve this add-on ^_^.

More detailed description of add-on features:

For highlighting chat-messages, the YouTube live-chat is separated vertically into two live-chats. The upper one is the original one, while the lower one displays chat-messages you may filter for. The sizes of the chat-boxes are adjustable via dragging the separator line between the chat-boxes up or down. The highlight chat-box is removable via the settings page and the YouTube live-chat drop-down menu.

The settings are preset to highlight common chat-based English translations of Japanese Hololive streams (at least the ones I watch). Furthermore, it is possible to view chat-messages as subtitles for the YouTube video player. If the subtitle chat-message is a translator chat-message, e.g. starting with [EN] for English, the translator tag [EN] is not displayed for a more immersive viewing experience. The style of the subtitle Font and Background is furthermore customizable via the settings page.

The add-on settings-page allows to add either simple translator filter rules for showing e.g. Hololive translator messages, or to add customizable filter-rules. The customizable filter rules search either the author-name or the message of a chat-message for search-texts. When a filter rule matches a chat-message, it will be either highlighted, shown as YouTube player subtitles, or deleted, where filter rules higher up in the filter rule list are applied first. The filter rules are draggable up or down the list for adjusting their priorities. Regular Expressions are available for filter rules when enabling the expert mode. The expert mode further enables a window for validating if your filter rule matches example YouTube live-chat authors and messages, which is especially useful if you are not sure if your customized filter rule will match YouTube messages.

## Installation
Before installing the add-on, rename either "manifest_mozilla.json" for Mozilla Firefox, or "manifest_google.json" for Google Chrome in "manifest.json".
### Mozilla Firefox
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
