if (document.querySelector("ytd-app") === null) {
    // YouTube live-chat iFrame
    if (document.querySelector("#chat>#item-list>#live-chat-item-list-panel")) {
        var youtubeFilter = new YouTubeFilter();
    }
} else {
    // YouTube player
    var overlay = new YouTubeOverlay();
}