// Click&Clean for Google Chrome - HOTCLEANER.COM - Copyright (c) 2016 Vlad & Serge Strukoff. All Rights Reserved.
(function(){function B(a){a:{for(var c=a.u,d=[chrome.runtime.getURL(""),"http://www.hotcleaner.com/","https://www.hotcleaner.com/","https://hotcleaner.com/","http://hotcleaner.com/"],b=0,e=d.length;b<e;b++)if(0==c.indexOf(d[b]))break a;document.location.href="about:blank"}t=a.v;x=a.t;a=g("timeInput");c=chrome.i18n.getMessage("history").split(";");calInit(a,0,0,y);a=g("refresh");a.title=c[1];a.addEventListener("click",y,!1);a=g("selAll");a.checked=!1;a.title=c[2];a.addEventListener("click",C,!1);a=
g("delSel");a.title=c[3];a.addEventListener("click",D,!1);a=g("filter");a.placeholder=c[0];a.addEventListener("change",u,!1);a.addEventListener("keyup",u,!1);a=g("save");a.title=c[5];a.addEventListener("click",E,!1)}function D(a){function c(){l+=2;l<e.length?chrome.runtime.sendMessage(JSON.stringify({id:11,v:{startTime:e[l],endTime:e[l+1]}}),c):p(0)}p(1);a=g("tab");var d=a.getElementsByClassName("item"),b=a.getElementsByClassName("chk"),e=[],k=[],f,h,l=d.length-1,m=0;for(f=l;-1<l;l--)f=d[l],h=b[l],
"none"==f.style.display?m&&(m=0,e.push(h.time-1)):h.checked?(k.push(f),m||(m=1,e.push(h.time-1))):m&&(m=0,e.push(h.time-1));for(f=0;f<k.length;f++)a.removeChild(k[f]);m&&e.push(h.time+1);l=-2;c()}function C(a){a=this.checked;var c=g("tab");z(a,c.firstElementChild,c.lastElementChild);this.checked=!a}function z(a,c,d){if(c&&d){var b=c,e="item"+(a?" itemSel":"");c.index>d.index&&(b=d,d=c);for(;b&&b.index<=d.index;)"none"!=b.style.display&&(b.firstElementChild.firstElementChild.checked=a,b.className=
e),b=b.nextElementSibling}}function F(){var a=g("tab"),c=a.getElementsByClassName("item"),a=a.getElementsByClassName("chk"),d,b,e,k;d=t.timeType;k=10==d?0:0==d?x:9==d?t.time:(new Date).getTime()-36E5*[0,1,2,4,8,10,12,24,168][d];for(var f=0;f<c.length;f++)d=c[f],b=a[f],"none"!=d.style.display&&(e=b.time<k?!1:!0,b.checked=e,d.className="item"+(e?" itemSel":""))}function u(){var a=g("filter").value;if(v!=a){v=a;for(var c=g("tab").getElementsByClassName("hLink"),d,b,e=new RegExp(a,"i"),k=0;k<c.length;k++)d=
c[k],b=1>a.length||d.textContent.match(e)?"":"none",d.parentElement.style.display=b}}function G(a){var c=this.parentElement.parentElement;a.shiftKey?(0>q&&(q=g("tab").firstElementChild),z(this.checked,c,q)):c.className="item"+(this.checked?" itemSel":"");q=c}function H(a,c){function d(a){k=document.createElement("button");k.className=a;g.appendChild(k);k.addEventListener("click",I,!1)}var b,e,k,f,h,l,m,g=document.createElement("div");g.index=c;g.className="item";b=document.createElement("input");
b.time=a.time;b.type="checkbox";b.checked=!1;b.className="chk histChk";b.addEventListener("click",G,!1);h=new Date(a.time);l=h.getMilliseconds();h=h.toTimeString().split(":");m=12>h[0]?"AM":"PM";h[2]=h[2].slice(0,2);e=document.createElement("label");e.className="histLabel";e.appendChild(b);e.appendChild(document.createTextNode(h[0]+":"+h[1]+" "+m));e.title=h[0]+":"+h[1]+":"+h[2]+":"+l;g.appendChild(e);f=document.createElement("a");f.className="hLink elps";chrome.runtime.sendMessage('{"id":5,"v":"chrome://favicon/'+
a.url+'"}',function(a){f.style.backgroundImage="url("+a+")"});f.href=a.url;f.title="Transition type: "+a.transition;f.target="_blank";f.appendChild(document.createTextNode(a.label));g.appendChild(f);d("ginfo");d("bing");d("build");return g}function J(a){a.sort(function(a,b){return b.time-a.time});for(var c=document.createDocumentFragment(),d,b=0;b<a.length;b++)(d=H(a[b],b))&&c.appendChild(d);g("tab").appendChild(c);u();F();p(0)}function K(a){function c(b){for(var c=0;c<b.length;c++)k=b[c],k.visitTime>
r&&k.visitTime<w&&(h={url:a[e].url,time:k.visitTime,label:a[e].title?a[e].title:a[e].url,transition:k.transition},f.push(h));e++;d()}function d(){e<a.length?chrome.runtime.sendMessage(JSON.stringify({id:13,v:{url:a[e].url}}),c):J(f)}if(1>a.length){var b=chrome.i18n.getMessage("history").split(";");g("tab").innerHTML='<p style="margin:10px;">'+b[4]+"</p>";p(0)}else{var e=0,k,f=[],h;d()}}function y(){p(1);g("tab").innerHTML=v="";r=parseInt(g("timeInput").getAttribute("data-time"));w=r+864E5;chrome.runtime.sendMessage(JSON.stringify({id:10,
v:{url:"http://www.hotcleaner.com/clear-browsing-history.html"}}),function(){chrome.runtime.sendMessage(JSON.stringify({id:10,v:{url:chrome.runtime.getURL("history.html")}}),function(){chrome.runtime.sendMessage(JSON.stringify({id:12,v:{text:"",startTime:r,endTime:w,maxResults:9999}}),K)})})}function I(a){a=this.className;var c=this.parentElement.getElementsByClassName("hLink")[0].href,d;"ginfo"==a?d="http://www.google.com/webhp?#q="+A(c):"bing"==a?d="http://www.bing.com/search?q="+A(c):"build"==
a&&(d="http://builtwith.com/?"+encodeURIComponent(c));chrome.runtime.sendMessage(JSON.stringify({id:9,v:d}))}function A(a){var c=a.indexOf("://"),d=a.indexOf("/",c+3);return a.slice(c+3,d)}function p(a){g("shade").style.display=a?"block":"none"}function L(a){function c(){d<a.length?(g=a[d],b=new Date(g.time),f=b.getDay(),f!=k&&(0<d&&(n+="</div>"),n+='<div class="date"><b>&#9662;</b> '+q[f]+", "+r[b.getMonth()]+" "+b.getDate()+", "+b.getFullYear()+'</div><div class="items">'),k=f,e=b.getMilliseconds(),
b=b.toTimeString().split(":"),h=12>b[0]?"AM":"PM",b[2]=b[2].slice(0,2),d++,chrome.runtime.sendMessage('{"id":5,"v1":1,"v":"chrome://favicon/'+g.url+'"}',function(a){n+='<div class="item"><span class="time" title="'+(b[0]+":"+b[1]+":"+b[2]+":"+e)+'">'+(b[0]+":"+b[1]+" "+h)+'</span><a class="label" style="background-image: url('+a+')" href="'+g.url+'" title="'+g.url+'" target="_blank">'+g.label+"</a></div>";setTimeout(c,0)})):(n+='</div><div id="ftr"></div><div id="sidebar"><div class="box"><h1>Browsing History</h1><div>Date generated</div><small>'+
(new Date).toLocaleString()+'</small></div><div class="hr"></div><div class="box"><h2>Connect</h2>&#9642; <a href="http://www.hotcleaner.com">Hotcleaner</a><br/>&#9642; <a href="http://www.hotcleaner.com/security-and-privacy-software-feedback.html" title="If you have any questions, ideas or suggestions, please feel free to contact us!">Support</a><br/>&#9642; <a href="https://www.facebook.com/clickclean" title="Join us on Facebook">Facebook</a><br/>&#9642; <a href="https://twitter.com/intent/user?screen_name=clickclean" title="Follow us on Twitter">Twitter</a><br/>&#9642; <a href="https://plus.google.com/share?url='+
m+'" title="Follow us on Google+">Google+</a><br/>&#9642; <a href="http://youtube.com/subscription_center?add_user=YTMoo" title="Subscribe to our YouTube channel">YouTube</a></div></div></div></body></html>',M(n),p(0))}a.sort(function(a,b){return b.time-a.time});var d=0,b,e,k,f,h,g,m=encodeURIComponent("http://www.hotcleaner.com"),n='<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><title>Browsing History</title><link rel="icon" type="image/png" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAAN1wAADdcBQiibeAAAAAd0SU1FB9oDBwAVAJKzMZQAAAJoSURBVDjLlZI7aJVBEIW/3bv/TUxyiYZ0FhECAREMXFRisBa0S20aC1EbFXyAaGEhGHw0VrFId7UQRMFCm5AgiKISDKIEX2gRbIIajf9jd3bH4kajZaYbmDnMd+aY05fuHHFZ7XLN2gbrqJjSTwnxjHPOTvz65RtBwnr2yVzW6O7KJpwxpnclL7HWAJA04b2QEohEAFSVjg5Hve6wxgJQ+ZKe7nqvU1V8CNSsRSRRlBW7mwMcP7iXLbsPs/h8im/LK0zdfsSTuc9s6OzAOUtMCVXFqULwCbGJnysl54/tY2R4EICyamNt6u3h1KH9PJ3/wMXrD2j0dKIJVMGqKkEieR4YbQ4wMjxIiPIfbxUCIQojw4OMNgfI80CQiKq2BUoRlouC8bFRfBC8b7Nb2+ZNUfE+4oMwPjbKclFQiqwJSIj4wtPf1yCvAl4iokq9njH9+BXULCEm8irQ39fAFx4JqxckBR8CXoTSB6JEJETyvOLGxBGOnp9i+tE8BkOUSOnbsz4E0h8PvCTUWN68WwRVRCJFUbFnx1aunD3AuSstogio8ubdImpse+cvgo84LJOtGTAGUaX0wo+8ZFdziIetC/iYwBgmWzM4LOL/MdGnSLKJ+YUvTN6cJXM1rLUkUapSEEkATN6cZX7hC8kmfIprORCfsFkNZzJu3XvBs5cfGR8bYdvQZgBev12kdfcp7z99pZ5lJAEJCVVoJ1EEDBgDNjO8/bzE2av3kdU8uJojcwaX1YgmIQJ+9Y1OVec2NjqbS99zzL/pMeCc+9sGUYK0BRXo39iFqs45VT2xa/uWa8BO1lfPVfXkbymMk1S9jJaDAAAAAElFTkSuQmCC"><style>*{margin:0;padding:0}html,body{height:100%}body{font:400 13px/1.231 \'Segoe UI\',Tahoma,Helvetica,\'Helvetica Neue\',Arial,sans-serif;color:#303942;background-color:#fff;cursor:default}h1,h2{color:#000;font-weight:400;margin-bottom:9px}h1{font-size:20px}h2{font-size:16px}a{text-decoration:none}a:hover{text-decoration:underline}.box a{color:#E80000}#page{height:100%;padding:0 20px;border-left:194px solid #f3f3f3}.date{font-size:22px;padding:16px 0;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;cursor:pointer}.items{position:relative;border-bottom:1px solid #c0c4c9;overflow:hidden;-webkit-transition:.2s;-moz-transition:.2s;-o-transition:.2s;-ms-transition:.2s;transition:.2s}.item{position:relative;padding:6px 0;border-bottom:1px solid #eaeef3;overflow:hidden}.time{position:absolute;left:0;top:6px;color:#909499;white-space:nowrap}.label{display:inline-block;padding-left:92px;background-position:70px 0;background-repeat:no-repeat;_padding-left:66px;*padding-left:66px}#ftr{height:72px}#sidebar{position:fixed;_position:absolute;left:0;top:0;width:193px;height:100%;line-height:18px;color:#999;background-color:#f5f5f5;border-right:1px solid #e3e3e3}.box,.hr{margin:9px 12px}.hr{border-top:1px solid #d9d9d9}.box h1+div,.box small{line-height:13px}</style><script type="text/javascript">window.onload=function(){for(var c=document.getElementById("page").childNodes,b=0,a;a=c[b];b++)1==a.nodeType&&"date"==a.className&&(a.nextSibling.style.height="0px",a.onclick=function(){var a=this.nextSibling;a.style.height=12<a.offsetHeight?"0px":a.scrollHeight+"px"})};\x3c/script></head><body><div id="page">',
q=chrome.i18n.getMessage("days").split(";"),r=chrome.i18n.getMessage("months").split(";");c()}function N(a){function c(b){for(var c=0;c<b.length;c++)k=b[c],h={url:a[e].url,time:k.visitTime,label:a[e].title?a[e].title:a[e].url},f.push(h);e++;d()}function d(){e<a.length?chrome.runtime.sendMessage(JSON.stringify({id:13,v:{url:a[e].url}}),c):L(f)}if(1>a.length){var b=chrome.i18n.getMessage("history").split(";");g("tab").innerHTML='<p style="margin:10px;">'+b[4]+"</p>";p(0)}else{var e=0,k,f=[],h;d()}}
function E(){p(1);chrome.runtime.sendMessage(JSON.stringify({id:12,v:{text:"",startTime:0,endTime:(new Date).getTime(),maxResults:99999}}),N)}function M(a){var c;Blob?c=new Blob([a],{type:"text/html;charset=UTF-8"}):BlobBuilder&&(c=new BlobBuilder,c.append(a),c=c.getBlob("text/html;charset=UTF-8"));O(c,"history.html")}function O(a,c){var d=document.createElement("a"),b=window.webkitURL||window.URL;d.href=b.createObjectURL(a);d.setAttribute("download",c);d.click();setTimeout(function(){b.revokeObjectURL(d.href)},
2E3)}function g(a){return document.getElementById(a)}var v,x,r,w,q=-1,t;window.addEventListener("load",function(){chrome.runtime.sendMessage('{"id":1}',B)},!1)})();
