// Click&Clean for Google Chrome - HOTCLEANER.COM - Copyright (c) 2016 Vlad & Serge Strukoff. All Rights Reserved.
(function(){function z(){function b(b){f=document.createElement("div");f.className="nav";f.id="menu"+b;f.textContent=a[b];f.addEventListener("click",C,!1)}if("loading"==document.readyState)setTimeout(z,0);else{701==l.ui?h("box").style.setProperty("filter","sepia(.5)"):702==l.ui?h("box").style.setProperty("filter","grayscale(1) brightness(1.17)"):703==l.ui?h("box").style.setProperty("filter","invert(1) sepia(1) saturate(0) brightness(1.7) contrast(.8)"):704==l.ui?h("box").style.setProperty("filter",
"invert(.9) sepia(1) brightness(.85) hue-rotate(20deg)"):705==l.ui?h("box").style.setProperty("filter","invert(.9) sepia(1) brightness(0.95) hue-rotate(155deg)"):706==l.ui&&h("box").style.setProperty("filter","invert(.87) sepia(1) brightness(0.95) hue-rotate(0deg)");var a=chrome.i18n.getMessage("menu").split(";"),c=document.createDocumentFragment(),d=h("menu"),f;d.id="menu";for(var e=0,m=a.length;e<m;e++)2!=e&&(b(e),c.appendChild(f));d.appendChild(c);h(k).className="nav act";A(k);h("box").addEventListener("click",
E,!1);/Win/.test(navigator.platform)&&chrome.runtime.sendMessage('{"id":15,"v":"000E"}',function(a){a&&(q=a,b(2),d.insertBefore(f,h("menu3")),setTimeout(function(){h("i9").firstElementChild.src="i/menu/quickscan.png";h("i14").firstElementChild.src="i/menu/cleanup.png";var a=chrome.i18n.getMessage("menu0").split(";");h("i9").firstElementChild.nextElementSibling.textContent=a[8];h("i14").firstElementChild.nextElementSibling.textContent=a[12]},1))})}}function C(){var b=this.id;k!=b&&(k&&(h(k).className=
"nav"),k=b,this.className="nav act",A(b))}function A(b){var a,d=h("box");if("menu0"==b)a=[3,"red","close.png",0,7,0,"options1.png",18,3,"magenta","clear.png",1,7,0,"options1.png",18,7,0,"tabs1.png",2,3,"violet","cache.png",3,7,0,"trash1.png",4,3,"violet","history.png",5,7,0,"trash1.png",6,0,"blue",q?"quickscan.png":"extensions.png",q?8:7,3,"violet","downloads.png",9,7,0,"trash1.png",10,0,"choko","cookie.png",15,7,0,"trash1.png",16,0,"seawave",q?"cleanup.png":"memory.png",q?12:13,3,"violet","security.png",
14,0,"carbon","incognito.png",11,0,"teal","report.png",17,0,"magenta","options.png",18,7,0,"themes.png",19,0,"green","updates.png",20,2,["yellow","bluefb","redgp","bluetw","redyt"],["rate32.png","facebook32.png","gplus32.png","twitter32.png","youtube32.png"],21];else if("menu1"==b)a=[3,"seawave","plugins.png",0,3,"green","extensions.png",1,3,"orange","experiments.png",2,3,"magenta","internals.png",3,0,"violet","dns.png",4,3,"violet","history.png",5,0,"violet","cache.png",6,0,"red","key.png",7,3,"blue",
"version.png",8,7,0,"arrow1.png",9,0,"red","conflicts.png",10,0,"teal","policies.png",11,0,"blue","releases.png",12,7,0,"calendar1.png",13,0,"blue","credits.png",14,0,"teal","bug.png",15];else if("menu2"==b)a=[3,"green","winsec.png",0,3,"blue","info.png",1,3,"red","uninstall.png",2,3,"violet","defragmenter.png",3,3,"magenta","sound.png",4,3,"marine","network.png",5,7,0,"connect.png",6,7,0,"wireless.png",7,3,"teal","devices.png",8,3,"violet","display.png",9,3,"blue","services.png",10,3,"seawave","directx.png",
11];else if("menu3"==b){c(chrome.runtime.getURL("ctrb.html"),0);window.close();return}var D=0;b=chrome.i18n.getMessage(b).split(";");for(var f=document.createDocumentFragment(),e,m,p,g,k,r,l,v,u,n,t=0;t<a.length;t+=4)l=t/4,p=a[t],r=a[t+1],v=a[t+2],2==p?(g=new Uint8Array(1),crypto.getRandomValues(g),g=g[0]%r.length,l="i"+(l+g),r=r[g],v="i/menu/"+v[g],n=b[a[t+3]+g]):(l="i"+l,v="i/menu/"+v,n=b[a[t+3]]),7>p?(u=0,e=document.createElement("div"),m=document.createElement("div"),k=document.createElement("div"),
g=new Image,r="btn "+r,2<p?(r+=" wide",e.className="btnBoxWide"):e.className="btnBox",m.id=l,m.className=r,g.className="icn",k.className="txt0",g.dataset.url=g.src=v,k.textContent=n,m.appendChild(g),m.appendChild(k),e.appendChild(m),f.appendChild(e)):(p=document.createElement("div"),e=document.createElement("div"),g=new Image,g.src=v,p.id=l,p.className="adt a"+u,g.className="icnm",e.className="txt1",e.textContent=n,p.appendChild(g),m.insertBefore(p,k),m.insertBefore(e,k),u++),D++;d.innerHTML="";d.appendChild(f);
d.style.display=""}function E(b){b=b.target.id?b.target:b.target.parentElement;var a=b.id;"menu0"==k?(a=parseInt(b.id.slice(1)),0==a?chrome.runtime.sendMessage('{"id":4}'):1==a?(chrome.runtime.sendMessage('{"id":0,"local":1,"url":"cleaner.html","w":770,"h":500}'),window.close()):2==a?u(b):3==a?(chrome.runtime.sendMessage('{"id":0,"local":1,"url":"cleaner.html","w":770,"h":500}'),window.close()):4==a?x(0,0,0):5==a?q?n("http://www.hotcleaner.com/cache-viewer.html",chrome.runtime.getURL("cache.html")):
c(d+"cache"):6==a?u(b,"cache"):7==a?n("http://www.hotcleaner.com/clear-browsing-history.html",chrome.runtime.getURL("history.html")):8==a?u(b,"history"):9==a?w("http://www.hotcleaner.com/clickclean-scan-for-malware.html",d+"extensions",1):10==a?c(d+"downloads"):11==a?u(b,"downloads"):12==a?n("http://www.hotcleaner.com/cookie-wiper.html",chrome.runtime.getURL("cookies.html")):13==a?u(b,"cookies"):14==a?q?B(115):c(d+"system"):15==a?w("http://www.hotcleaner.com/clickclean-app.html#chvijda","https://myaccount.google.com/intro/privacycheckup/1",
1):16==a?chrome.windows.create({url:void 0,incognito:!0,focused:!0,top:-3,left:-8,width:screen.availWidth+16,height:screen.availHeight+6}):17==a?w("http://www.hotcleaner.com/security-and-privacy-software-feedback.html#chvijda","https://plus.google.com/101494399825495328979",1):18==a?(chrome.runtime.sendMessage('{"id":0,"local":1,"url":"cleaner.html","w":770,"h":500}'),window.close()):19==a?c("http://www.hotcleaner.com/clickclean-appearance.html",0):20==a?w("http://www.hotcleaner.com/clickclean_chrome_update_checker.html#chvijda",
"https://chrome.google.com/webstore/detail/clickclean/ghgabhipcejejjmhhchfonmamedcbeod/reviews",1):21==a?c("https://chrome.google.com/webstore/detail/clickclean/ghgabhipcejejjmhhchfonmamedcbeod/reviews"):22==a?c("https://www.facebook.com/clickclean",0):23==a?c("https://plus.google.com/101494399825495328979/posts",0):24==a?c("https://twitter.com/intent/user?screen_name=clickclean",0):25==a&&c("https://youtube.com/subscription_center?add_user=YTMoo",0)):"menu1"==k?(a=parseInt(b.id.slice(1)),0==a?c(d+
"plugins"):1==a?c(d+"extensions"):2==a?c(d+"flags"):3==a?c(d+"net-internals"):4==a?c(d+"dns"):5==a?n("http://www.hotcleaner.com/clear-browsing-history.html",chrome.runtime.getURL("history.html")):6==a?q?n("http://www.hotcleaner.com/cache-viewer.html",chrome.runtime.getURL("cache.html")):c(d+"cache"):7==a?chrome.windows.create({url:"pgen.html",type:"popup",focused:!0,width:350,height:216}):8==a?c("o"==d.charAt(0)?d+"about":d+"version"):9==a?c("https://chrome.googleblog.com/"):10==a?c(d+(q?"conflicts":
"crashes")):11==a?c(d+"policy"):12==a?c("https://googlechromereleases.blogspot.com/"):13==a?c("https://www.chromium.org/developers/calendar"):14==a?c("o"==d.charAt(0)?d+"about/credits":d+"credits"):15==a&&c("https://code.google.com/p/chromium/issues/list")):"menu2"==k&&(a=parseInt(b.id.slice(1))+100,B(a))}function B(b){chrome.runtime.sendMessage('{"id":15,"v":"00'+b.toString(16)+'"}',function(){})}function x(b,a,c){chrome.tabs.query(a?{active:!0}:{},function(d){d.forEach(function(f,e){a?chrome.tabs.reload(f.id):
e?chrome.tabs.remove(f.id):chrome.tabs.update(f.id,{url:b?"about:blank":"chrome-search://local-ntp/local-ntp.html"});c&&e==d.length-1&&setTimeout(c,500)})})}function u(b,a,c){function d(){f.p28&&window.Audio&&(new Audio("erased.ogg")).play();setTimeout(function(){e.src="i/menu/done.png";setTimeout(function(){e.src=e.dataset.url;c&&chrome.tabs.query({},function(a){a.forEach(function(a,b){chrome.tabs.remove(a.id)})})},900);y=!1},300)}if(!y){y=!0;var f,e=a?b.previousElementSibling:b.firstElementChild;
e.src="i/menu/wipe.gif";chrome.runtime.sendMessage('{"id":3}',function(b){f=b;a?chrome.runtime.sendMessage('{"id":19,"v":{"since":-1},"v2":{"'+a+'":true}}',d):f.p0||c?x(c,0,function(){chrome.runtime.sendMessage('{"id":18}',d)}):chrome.runtime.sendMessage('{"id":18}',function(){f.p25?x(0,1,d):d()})})}}function n(b,a){chrome.runtime.sendMessage('{"id":8,"v":"'+b+'","v3":"'+a+'"}')}function c(b,a){chrome.runtime.sendMessage('{"id":9,"v":"'+b+'","i":'+(a?1:0)+"}")}function w(b,a,c){F(function(d){chrome.runtime.sendMessage('{"id":9,"v":"'+
(d?b:a)+'","i":'+(c?1:0)+"}")})}function F(b){var a=new Image;a.onload=function(){b(1)};a.onerror=function(){b()};a.onabort=function(){b()};a.src="http://www.hotcleaner.com/img/1.gif?t="+(new Date).getTime()}function h(b){return document.getElementById(b)}var l,q,y=!1,d=/Comodo/.test(navigator.appVersion)?"dragon://":/OPR/.test(navigator.appVersion)?"opera://":"chrome://",k="menu0";chrome.runtime.sendMessage('{"id":3}',function(b){l=b;z()})})();
