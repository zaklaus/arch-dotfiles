LPMessaging=function(n){var p=0,h={},q=0,j=function(c){var a={},b=!1,d;for(d in c)if(c.hasOwnProperty(d)){var e=c[d];switch(typeof e){case "function":b=b||!0;a[d]=!0;break;case "object":a[d]=j(e),b=b||null!==a[d]}}return b?a:null},k=function(c){var a={},b;for(b in c)if(c.hasOwnProperty(b)){var d=c[b];switch(typeof d){case "function":a[b]=d;delete c[b];break;case "object":a[b]=k(d)}}return a},l=function(c){for(var a=c.args,b=0;b<a.length;++b)"object"===typeof a[b]&&("[object Object]"===Object.prototype.toString.call(a[b])&&
null!==Object.getPrototypeOf(Object.getPrototypeOf(a[b])))&&(a[b]=void 0);if(a=j(c.args))b=++q,h[b]=k(c.args),c.requestID=b,c.functions=a},r=function(c,a,b){return function(d){for(var e={responseRequestID:a.requestID,callbackPath:b},f=[],g=0,h=arguments.length;g<h;++g)f.push(arguments[g]);e.args=f;l(e);c(e)}},m=function(c,a,b,d,e){e=e||[];for(var f in b){var g=b[f];switch(typeof g){case "object":m(c,a[f],g,d,e.concat(f));break;default:a[f]=r(c,d,e.concat(f))}}};return{handleRequest:function(c,a,b,
d){var e=a.args;m(b,e,a.functions,a);LPReflection.callFunction(c,a.cmd,e,d)},makeRequest:function(c,a){l(a.data);return c(a)},handleResponse:function(c){var a=h[c.responseRequestID];delete h[c.responseRequestID];for(var b=0,d=c.callbackPath.length;b<d;++b)a=a[c.callbackPath[b]];a.apply(n,c.args)},getNewMessageSourceID:function(){return++p}}}(this);
