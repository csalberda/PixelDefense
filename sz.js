$ = jQuery;

var szDevice = {};

function hideMediaOverlay() {
  $('#sz-media-overlay').css('display', 'none');
}

function playMedia() {
  hideMediaOverlay();
  if ($('#sz-media-player').len > 0) {
    var mediaPlayer = document.getElementById('sz-media-player');
    mediaPlayer.play();
  }
  else if (typeof resumeGame == 'function') {
    hideMediaOverlay();
    resumeGame();
  }
}

function showMediaOverlay() {
  $('#sz-media-overlay').css('display', 'table');
  var parent = $('#sz-media-overlay').parent();
  var height = $(parent).height();
  $('#sz-media-overlay').css('height', height + 'px');
}

function restartMedia() {
  if ($('#sz-media-player').length > 0) {
    hideMediaOverlay();
    var mediaPlayer = document.getElementById('sz-media-player');
    mediaPlayer.currentTime = 0;
    mediaPlayer.play();
  }
  else if (typeof restartGame == 'function') {
    hideMediaOverlay();
    restartGame();
  }
  else {
    location.reload();
  }
}

function szForceOrientation(orientation) {
  var div = '<div id="force-orientation-' + orientation + '" class="force-orientation-overlay"><div id="force-orientation-inner"><div id="force-orientation-image"><img src="/sites/default/files/backgrounds/device.png" id="force-orientation-device"></div></div></div>';
  $('#phaser-content').append(div);
}

function szStartFullscreen() {
  var elem = document.getElementById('phaser-wrapper');
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  }
  else if (elem.msRequestFullscreen) {
    elem.msRequestFullscreen();
  }
  else if (elem.mozRequestFullScreen) {
    elem.mozRequestFullScreen();
  }
  else if (elem.webkitRequestFullscreen) {
    elem.webkitRequestFullscreen();
  }
  else {
    szToggleFullscreen();
  }
}

function szToggleFullscreen() {
  $('#phaser-wrapper').toggleClass('fullscreen');
  if (!$('#phaser-wrapper').hasClass('fullscreen')) {
    if (typeof onStopFullscreen == 'function') {
      onStopFullscreen();
    }
  }
}

/**
* Checks for support of the Full Screen API.
*/
function szCheckFullScreenSupport () {

  var fs = [
      'requestFullscreen',
      'requestFullScreen',
      'webkitRequestFullscreen',
      'webkitRequestFullScreen',
      'msRequestFullscreen',
      'msRequestFullScreen',
      'mozRequestFullScreen',
      'mozRequestFullscreen'
  ];

  var element = document.getElementById('phaser-wrapper');
  if (element != null) {
    for (var i = 0; i < fs.length; i++) {
        if (element[fs[i]]) {
            szDevice.fullscreen = true;
            szDevice.requestFullscreen = fs[i];
            break;
        }
    }

    var cfs = [
        'cancelFullScreen',
        'exitFullscreen',
        'webkitCancelFullScreen',
        'webkitExitFullscreen',
        'msCancelFullScreen',
        'msExitFullscreen',
        'mozCancelFullScreen',
        'mozExitFullscreen'
    ];

    if (szDevice.fullscreen) {
        for (var i = 0; i < cfs.length; i++) {
            if (document[cfs[i]]) {
                szDevice.cancelFullscreen = cfs[i];
                break;
            }
        }
    }

    //  Keyboard Input?
    if (window['Element'] && Element['ALLOW_KEYBOARD_INPUT']) {
        szDevice.fullscreenKeyboard = true;
    }
  }
}

$(document).ready(function() {
  szCheckFullScreenSupport();
  if (szDevice.fullscreen) {
    var elem = document.getElementById('phaser-wrapper');
    console.log(szDevice.cancelFullscreen);
    document.addEventListener('webkitfullscreenchange', szToggleFullscreen, false);
    document.addEventListener('mozfullscreenchange', szToggleFullscreen, false);
    document.addEventListener('MSFullscreenChange', szToggleFullscreen, false);
    document.addEventListener('fullscreenchange', szToggleFullscreen, false);
  }
});
