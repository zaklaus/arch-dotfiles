// Support code (c) 2016 All Rights Reserved.
// If you want to review the code please contact me at aproject180@gmail.com
// If you don't wish to support me you may disable it in the settings. 

(function () {

  //The localStorage property allows you to access a local Storage object. 
  //localStorage is similar to sessionStorage. The only difference is that, while data stored in localStorage has no expiration time, 
  //data stored in sessionStorage gets cleared when the browsing session ends—that is, when the browser is closed.
  var stored = localStorage;

  var user_blacklist = stored.p180_blacklist ? JSON.parse(stored.p180_blacklist) : {};
  var server_blacklist = stored.p180_blacklist2 ? JSON.parse(stored.p180_blacklist2) : {};

  //gives the unix epoch timestamp
  var next_impression = +new Date;

  if (typeof stored.support == "undefined")
    stored.support = "true";
  if (typeof stored.install_date == "undefined")
    stored.install_date = +new Date;
  if (typeof stored.chance == "undefined")
    stored.chance = 0.6;
  if (typeof stored.random_high == "undefined")
    stored.random_high = 10; // [sec]
  if (typeof stored.random_low == "undefined")
    stored.random_low = 2; // [sec]
  if (typeof stored.p180_last_update == "undefined")
    stored.p180_last_update = +new Date;
  if (typeof stored.p180_exclude_https == "undefined")
    stored.p180_exclude_https = 'false';

  p180_whitelist = {};
  p180_blacklist = {};

  //Fired when the extension is first installed, when the extension is updated to a new version, 
  //and when Chrome is updated to a new version.
  //sets the last updated time stamp to the current epoch timestamp
  chrome.runtime.onInstalled.addListener(function (details) {
    if (/^(update|install)$/.test(details.reason))
      stored.p180_last_update = +new Date;
  });

  //if ad support is enabled, then insert the whitelist and blacklist js files in the background.html page
  if (stored.support == "true") {
    var script1 = document.createElement("script");
    script1.src = "support/lists/whitelist.js";
    document.documentElement.appendChild(script1);

    var script2 = document.createElement("script");
    script2.src = "support/lists/blacklist.js";
    document.documentElement.appendChild(script2);
  }

  stored.day || (stored.day = new Date(+new Date + stored.timezone).getUTCDate());
  stored.impressions || (stored.impressions = "0");

  //check which day it is in the localStorage object
  function check_day() {
    var day = new Date(+new Date + stored.timezone).getUTCDate();
    if (stored.day != day) {
      stored.day = day;
      stored.impressions = "0";
    }
  }

  //call the above function once followed by an interval of every 5 minutes
  check_day();
  setInterval(check_day, 5 * 60 * 1000);

  //Returns a random integer between min (included) and max (included)
  function get_random_int(min, max) {
    //The Math.floor() function returns the largest integer less than or equal to a given number.
    //The Math.random() function returns a floating-point, pseudo-random number in the range from 0 (inclusive) up to but not including 1 (exclusive)
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function get_domain(host) {
    var parts = host.split('.');
    var domain = parts[parts.length - 2] + "." + parts[parts.length - 1];
    if (/^com?$/.test(parts[parts.length - 2])) // .co.<TLD> / .com.<TLD>
      domain = parts[parts.length - 3] + "." + domain;
    return domain;
  }

  function on_message(message, sender, sendResponse) {
    if (message == "get-impressions") {
      sendResponse(stored.impressions);
    }
    else if (message == "inc-impressions") {
      stored.impressions = (++stored.impressions);
    }
    else if (message.name == "is-enabled") {
      var host = message.data;
      var domain = get_domain(host);
      var enabled = (stored.support == "true");
      var on_whitelist = p180_whitelist[domain];
      var not_blacklisted = !user_blacklist[host]
        && !p180_blacklist[domain]
        && !server_blacklist[domain];
      var random_chance = Math.random() < stored.chance;
      var elapsed_enough = (+new Date > next_impression);
      var protocol_ok = !(stored.p180_exclude_https == 'true' && message.protocol == 'https:');

      var response = elapsed_enough
        && enabled
        && not_blacklisted
        && on_whitelist
        && random_chance
        && protocol_ok;

      if (response) {
        var delta = get_random_int(stored.random_low * 1000, stored.random_high * 1000);
        next_impression = +new Date + delta;
      }

      sendResponse({ enabled: response, next_impression: next_impression });

    }
    else if (message.name == "set-next-impression") {
      next_impression = message.data;
    }
    else if (message.name == "set-impressions") {
      stored.impressions = message.data;
    }
    else if (message.name == "blacklist-add") {
      var host = message.data;
      user_blacklist[host] = 1;
      stored.p180_blacklist = JSON.stringify(user_blacklist);
    }
    else if (message.name == "passback-empty") {
      chrome.tabs.sendMessage(sender.tab.id, message);
    }
  }

  chrome.extension.onMessage.addListener(on_message);

})();