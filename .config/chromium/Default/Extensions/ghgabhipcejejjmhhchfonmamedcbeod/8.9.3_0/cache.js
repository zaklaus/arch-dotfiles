// Click&Clean for Google Chrome - HOTCLEANER.COM - Copyright (c) 2016 Vlad & Serge Strukoff. All Rights Reserved.
(function(){function C(b){k(1);D(b);E();chrome.runtime.sendMessage('{"id":15,"v":"0078"}',function(b){0==b?(z(),k(0)):(a=b.split("\n"),f(1))})}function F(){k(1);z();chrome.runtime.sendMessage('{"id":15,"v":"0078"}',function(b){0==b?k(0):(a=b.split("\n"),f(1))})}function G(b){b=this.parentElement.getAttribute("data-key");chrome.runtime.sendMessage(JSON.stringify({id:9,v:b}))}function H(b){b=this.parentElement.parentElement.getAttribute("data-key");chrome.runtime.sendMessage(JSON.stringify({id:9,v:"chrome://view-http-cache/"+
b}))}function I(){k(1);chrome.runtime.sendMessage('{"id":19,"v":{"since":-1},"v2":{"cache":true}}',function(){z();k(0)})}function J(b){chrome.runtime.sendMessage('{"id":15,"v":"0079","v2":"'+this.getAttribute("fname")+'"}',function(b){})}function K(){0<l&&(l--,c=r[l],f(0))}function L(){c<a.length&&(l++,r[l]=c,f(0))}function A(b,h,a,c,g){var e=document.createElement("div"),d=document.createElement("div"),n=document.createElement("div"),l=document.createElement("div"),k=document.createElement("div"),
f=document.createElement("div");e.className="item";e.setAttribute("data-ct",a);e.setAttribute("data-b",g);n.className="iftr";l.className="ibtn idat";k.className="ibtn iexp";f.className="iinf";e.setAttribute("data-key",h);l.title=v[13];e.appendChild(d);e.appendChild(n);e.appendChild(f);"0"!=c&&(k.setAttribute("fname",c),n.appendChild(k),k.title=v[14],k.addEventListener("click",J,!1));n.appendChild(l);n.appendChild(document.createTextNode(M(h)));if(-1<a.search(/image/)&&524288>g){var u=new Image,t,
q,r,x;u.onload=function(){t=this.width;q=this.height;0<t&&0<q?(1024>t&&1024>q?(176<t||110<q?1.6<t/q?(x=parseInt(176*q/t),r=176,this.style.marginTop=parseInt((110-x)/2)+"px"):(r=parseInt(110*t/q),x=110):(r=t,x=q,this.style.marginTop=parseInt((110-q)/2)+"px"),this.style.width=r+"px",this.style.height=x+"px",d.className="iimg",d.appendChild(u)):(d.className="itxt",d.textContent=a),f.textContent=t+"x"+q+" "+w(g)):(d.className="itxt",d.textContent=a,f.textContent=w(g))};u.src=h}else d.className="itxt",
d.textContent=a,f.textContent=w(g);d.addEventListener("click",G,!1);l.addEventListener("click",H,!1);b.appendChild(e)}function f(b){k(1);var h=d("search").value,m=y.getAttribute("data-ct"),p=document.createDocumentFragment(),g;if(1>h.length)if("/"==m)for(g=0;c<a.length&&(A(p,a[c],a[c+1],a[c+2],a[c+3]),g++,c+=4,60!=g););else{g=0;for(var e;c<a.length&&(e=a[c+1],-1<e.indexOf(m)&&(A(p,a[c],a[c+1],a[c+2],a[c+3]),g++),c+=4,60!=g););}else{g=0;for(var f;c<a.length&&(e=a[c],f=a[c+1],-1<e.indexOf(h)&&-1<f.indexOf(m)&&
(A(p,a[c],a[c+1],a[c+2],a[c+3]),g++),c+=4,60!=g););}d("content").textContent="";d("content").appendChild(p);if(b)if(1>h.length)if("/"==m){h=m=0;for(b=3;b<a.length;b+=4)h+=parseInt(a[b]),m++;u=m+" items / "+w(h)}else{for(e=p=h=0;e<a.length;e+=4)b=a[e+1],-1<b.indexOf(m)&&(p+=parseInt(a[e+3]),h++);u=h+" items / "+w(p)}else{for(var n=f=b=0;n<a.length;n+=4)p=a[n],e=a[n+1],-1<p.indexOf(h)&&-1<e.indexOf(m)&&(f+=parseInt(a[n+3]),b++);u=b+" items / "+w(f)}m=60*l;g=m+g;d("info").textContent=m+"-"+g+" of "+
u;d("prev").style.opacity=1>m?.5:1;d("next").style.opacity=g==parseInt(u)?.5:1;d("info2").textContent=l+1;d("tab").scrollTop=0;k(0)}function z(){l=c=0;r=[0];a=[];d("info").textContent="0 items / 0 MB";d("info2").textContent="-";d("content").textContent=v[15];d("next").style.opacity=d("prev").style.opacity=.5}function B(){l=c=0;r=[0];this.hasAttribute("data-ct")&&(y.className="btn nav",this.className="btn nav on",y=this);f(1)}function w(b){return 1048577>b?(b/1024).toFixed(1)+"KB":(b/1048576).toFixed(1)+
"MB"}function k(b){d("shade").style.display=b?"block":"none";d("clear").firstElementChild.src=b?"i/wipe.gif":"i/del1.png"}function E(){function b(b,c){a.addEventListener("click",c,!1);a.title=v[b];a=a.nextElementSibling}var a;y=a=d("hdr").firstElementChild;for(var c=0;7>c;c++)b(c,B);b(7,F);b(8,I);a.addEventListener("keyup",B,!1);a.setAttribute("placeholder",v[9]);a=d("prev");b(10,K);a.title=v[11];a=a.nextElementSibling;b(12,L)}function M(b){var a=b.indexOf(":")+3,c=b.indexOf("/",a);return b.slice(a,
c)}function D(a){for(var c=[chrome.runtime.getURL(""),"http://www.hotcleaner.com/","https://www.hotcleaner.com/","https://hotcleaner.com/","http://hotcleaner.com/"],d=0,f=c.length;d<f;d++)if(0==a.indexOf(c[d]))return;document.location.href="about:blank"}function d(a){return document.getElementById(a)}var a,c=0,r=[0],l=0,u,y,v=chrome.i18n.getMessage("cache").split(";");window.addEventListener("load",function(){chrome.runtime.sendMessage('{"id":2}',C)},!1)})();
