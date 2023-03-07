if (document.getElementById("player") === null) {  // YouTube live-chat iFrame
    var youtubeFilter = new YouTubeFilter();
} else {  // YouTube player
    // Sends message to background page if YouTube video seeking
    document.getElementsByClassName("video-stream")[0].addEventListener("seeking", () => {
        chrome.runtime.sendMessage({ "type": "replay" });
    });

    var overlay = new YouTubeOverlay();
}