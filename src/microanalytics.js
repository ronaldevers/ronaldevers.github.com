/* microanalytics.io */!function(e){"use strict";function t(t,r){if(navigator.doNotTrack)return!1;var a={};a.referrer=r||e.document.referrer,a.page=e.location.href.replace(/#.+$/,""),a.screen_resolution=screen.width+"x"+screen.height,t&&(a.event=t);var o=new XMLHttpRequest;o.open("POST","https://microanalytics.io/api/event",!0),o.setRequestHeader("Content-Type","application/json; charset=utf-8"),o.send(JSON.stringify(a))}try{var r=history.pushState;history.pushState=function(){var n=e.location.href.replace(/#.+$/,"");r.apply(history,arguments),t(null,n)},e.onpopstate=function(e){t(null)},e.pa={},e.pa.track=t,t(null)}catch(e){console.log(e.message)}}(window);