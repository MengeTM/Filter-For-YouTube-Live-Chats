if (document.querySelector("ytd-app") === null) {  // YouTube live-chat iFrame
    var youtubeFilter = new YouTubeFilter();
} else {  // YouTube player
   
    var overlay = new YouTubeOverlay();
}