(()=>{var e={653:(e,t,r)=>{e.exports=r(555)},685:(e,t,r)=>{"use strict";var n=r(501),o=r(63),i=r(233),s=r(306),a=r(938),u=r(644),c=r(977),l=r(135);e.exports=function(e){return new Promise((function(t,r){var f=e.data,p=e.headers,d=e.responseType;n.isFormData(f)&&delete p["Content-Type"];var h=new XMLHttpRequest;if(e.auth){var m=e.auth.username||"",v=e.auth.password?unescape(encodeURIComponent(e.auth.password)):"";p.Authorization="Basic "+btoa(m+":"+v)}var g=a(e.baseURL,e.url);function y(){if(h){var n="getAllResponseHeaders"in h?u(h.getAllResponseHeaders()):null,i={data:d&&"text"!==d&&"json"!==d?h.response:h.responseText,status:h.status,statusText:h.statusText,headers:n,config:e,request:h};o(t,r,i),h=null}}if(h.open(e.method.toUpperCase(),s(g,e.params,e.paramsSerializer),!0),h.timeout=e.timeout,"onloadend"in h?h.onloadend=y:h.onreadystatechange=function(){h&&4===h.readyState&&(0!==h.status||h.responseURL&&0===h.responseURL.indexOf("file:"))&&setTimeout(y)},h.onabort=function(){h&&(r(l("Request aborted",e,"ECONNABORTED",h)),h=null)},h.onerror=function(){r(l("Network Error",e,null,h)),h=null},h.ontimeout=function(){var t="timeout of "+e.timeout+"ms exceeded";e.timeoutErrorMessage&&(t=e.timeoutErrorMessage),r(l(t,e,e.transitional&&e.transitional.clarifyTimeoutError?"ETIMEDOUT":"ECONNABORTED",h)),h=null},n.isStandardBrowserEnv()){var b=(e.withCredentials||c(g))&&e.xsrfCookieName?i.read(e.xsrfCookieName):void 0;b&&(p[e.xsrfHeaderName]=b)}"setRequestHeader"in h&&n.forEach(p,(function(e,t){void 0===f&&"content-type"===t.toLowerCase()?delete p[t]:h.setRequestHeader(t,e)})),n.isUndefined(e.withCredentials)||(h.withCredentials=!!e.withCredentials),d&&"json"!==d&&(h.responseType=e.responseType),"function"==typeof e.onDownloadProgress&&h.addEventListener("progress",e.onDownloadProgress),"function"==typeof e.onUploadProgress&&h.upload&&h.upload.addEventListener("progress",e.onUploadProgress),e.cancelToken&&e.cancelToken.promise.then((function(e){h&&(h.abort(),r(e),h=null)})),f||(f=null),h.send(f)}))}},555:(e,t,r)=>{"use strict";var n=r(501),o=r(958),i=r(303),s=r(445);function a(e){var t=new i(e),r=o(i.prototype.request,t);return n.extend(r,i.prototype,t),n.extend(r,t),r}var u=a(r(36));u.Axios=i,u.create=function(e){return a(s(u.defaults,e))},u.Cancel=r(930),u.CancelToken=r(939),u.isCancel=r(414),u.all=function(e){return Promise.all(e)},u.spread=r(363),u.isAxiosError=r(465),e.exports=u,e.exports.default=u},930:e=>{"use strict";function t(e){this.message=e}t.prototype.toString=function(){return"Cancel"+(this.message?": "+this.message:"")},t.prototype.__CANCEL__=!0,e.exports=t},939:(e,t,r)=>{"use strict";var n=r(930);function o(e){if("function"!=typeof e)throw new TypeError("executor must be a function.");var t;this.promise=new Promise((function(e){t=e}));var r=this;e((function(e){r.reason||(r.reason=new n(e),t(r.reason))}))}o.prototype.throwIfRequested=function(){if(this.reason)throw this.reason},o.source=function(){var e;return{token:new o((function(t){e=t})),cancel:e}},e.exports=o},414:e=>{"use strict";e.exports=function(e){return!(!e||!e.__CANCEL__)}},303:(e,t,r)=>{"use strict";var n=r(501),o=r(306),i=r(942),s=r(158),a=r(445),u=r(169),c=u.validators;function l(e){this.defaults=e,this.interceptors={request:new i,response:new i}}l.prototype.request=function(e){"string"==typeof e?(e=arguments[1]||{}).url=arguments[0]:e=e||{},(e=a(this.defaults,e)).method?e.method=e.method.toLowerCase():this.defaults.method?e.method=this.defaults.method.toLowerCase():e.method="get";var t=e.transitional;void 0!==t&&u.assertOptions(t,{silentJSONParsing:c.transitional(c.boolean,"1.0.0"),forcedJSONParsing:c.transitional(c.boolean,"1.0.0"),clarifyTimeoutError:c.transitional(c.boolean,"1.0.0")},!1);var r=[],n=!0;this.interceptors.request.forEach((function(t){"function"==typeof t.runWhen&&!1===t.runWhen(e)||(n=n&&t.synchronous,r.unshift(t.fulfilled,t.rejected))}));var o,i=[];if(this.interceptors.response.forEach((function(e){i.push(e.fulfilled,e.rejected)})),!n){var l=[s,void 0];for(Array.prototype.unshift.apply(l,r),l=l.concat(i),o=Promise.resolve(e);l.length;)o=o.then(l.shift(),l.shift());return o}for(var f=e;r.length;){var p=r.shift(),d=r.shift();try{f=p(f)}catch(e){d(e);break}}try{o=s(f)}catch(e){return Promise.reject(e)}for(;i.length;)o=o.then(i.shift(),i.shift());return o},l.prototype.getUri=function(e){return e=a(this.defaults,e),o(e.url,e.params,e.paramsSerializer).replace(/^\?/,"")},n.forEach(["delete","get","head","options"],(function(e){l.prototype[e]=function(t,r){return this.request(a(r||{},{method:e,url:t,data:(r||{}).data}))}})),n.forEach(["post","put","patch"],(function(e){l.prototype[e]=function(t,r,n){return this.request(a(n||{},{method:e,url:t,data:r}))}})),e.exports=l},942:(e,t,r)=>{"use strict";var n=r(501);function o(){this.handlers=[]}o.prototype.use=function(e,t,r){return this.handlers.push({fulfilled:e,rejected:t,synchronous:!!r&&r.synchronous,runWhen:r?r.runWhen:null}),this.handlers.length-1},o.prototype.eject=function(e){this.handlers[e]&&(this.handlers[e]=null)},o.prototype.forEach=function(e){n.forEach(this.handlers,(function(t){null!==t&&e(t)}))},e.exports=o},938:(e,t,r)=>{"use strict";var n=r(473),o=r(533);e.exports=function(e,t){return e&&!n(t)?o(e,t):t}},135:(e,t,r)=>{"use strict";var n=r(889);e.exports=function(e,t,r,o,i){var s=new Error(e);return n(s,t,r,o,i)}},158:(e,t,r)=>{"use strict";var n=r(501),o=r(97),i=r(414),s=r(36);function a(e){e.cancelToken&&e.cancelToken.throwIfRequested()}e.exports=function(e){return a(e),e.headers=e.headers||{},e.data=o.call(e,e.data,e.headers,e.transformRequest),e.headers=n.merge(e.headers.common||{},e.headers[e.method]||{},e.headers),n.forEach(["delete","get","head","post","put","patch","common"],(function(t){delete e.headers[t]})),(e.adapter||s.adapter)(e).then((function(t){return a(e),t.data=o.call(e,t.data,t.headers,e.transformResponse),t}),(function(t){return i(t)||(a(e),t&&t.response&&(t.response.data=o.call(e,t.response.data,t.response.headers,e.transformResponse))),Promise.reject(t)}))}},889:e=>{"use strict";e.exports=function(e,t,r,n,o){return e.config=t,r&&(e.code=r),e.request=n,e.response=o,e.isAxiosError=!0,e.toJSON=function(){return{message:this.message,name:this.name,description:this.description,number:this.number,fileName:this.fileName,lineNumber:this.lineNumber,columnNumber:this.columnNumber,stack:this.stack,config:this.config,code:this.code}},e}},445:(e,t,r)=>{"use strict";var n=r(501);e.exports=function(e,t){t=t||{};var r={},o=["url","method","data"],i=["headers","auth","proxy","params"],s=["baseURL","transformRequest","transformResponse","paramsSerializer","timeout","timeoutMessage","withCredentials","adapter","responseType","xsrfCookieName","xsrfHeaderName","onUploadProgress","onDownloadProgress","decompress","maxContentLength","maxBodyLength","maxRedirects","transport","httpAgent","httpsAgent","cancelToken","socketPath","responseEncoding"],a=["validateStatus"];function u(e,t){return n.isPlainObject(e)&&n.isPlainObject(t)?n.merge(e,t):n.isPlainObject(t)?n.merge({},t):n.isArray(t)?t.slice():t}function c(o){n.isUndefined(t[o])?n.isUndefined(e[o])||(r[o]=u(void 0,e[o])):r[o]=u(e[o],t[o])}n.forEach(o,(function(e){n.isUndefined(t[e])||(r[e]=u(void 0,t[e]))})),n.forEach(i,c),n.forEach(s,(function(o){n.isUndefined(t[o])?n.isUndefined(e[o])||(r[o]=u(void 0,e[o])):r[o]=u(void 0,t[o])})),n.forEach(a,(function(n){n in t?r[n]=u(e[n],t[n]):n in e&&(r[n]=u(void 0,e[n]))}));var l=o.concat(i).concat(s).concat(a),f=Object.keys(e).concat(Object.keys(t)).filter((function(e){return-1===l.indexOf(e)}));return n.forEach(f,c),r}},63:(e,t,r)=>{"use strict";var n=r(135);e.exports=function(e,t,r){var o=r.config.validateStatus;r.status&&o&&!o(r.status)?t(n("Request failed with status code "+r.status,r.config,null,r.request,r)):e(r)}},97:(e,t,r)=>{"use strict";var n=r(501),o=r(36);e.exports=function(e,t,r){var i=this||o;return n.forEach(r,(function(r){e=r.call(i,e,t)})),e}},36:(e,t,r)=>{"use strict";var n=r(806),o=r(501),i=r(799),s=r(889),a={"Content-Type":"application/x-www-form-urlencoded"};function u(e,t){!o.isUndefined(e)&&o.isUndefined(e["Content-Type"])&&(e["Content-Type"]=t)}var c,l={transitional:{silentJSONParsing:!0,forcedJSONParsing:!0,clarifyTimeoutError:!1},adapter:(("undefined"!=typeof XMLHttpRequest||void 0!==n&&"[object process]"===Object.prototype.toString.call(n))&&(c=r(685)),c),transformRequest:[function(e,t){return i(t,"Accept"),i(t,"Content-Type"),o.isFormData(e)||o.isArrayBuffer(e)||o.isBuffer(e)||o.isStream(e)||o.isFile(e)||o.isBlob(e)?e:o.isArrayBufferView(e)?e.buffer:o.isURLSearchParams(e)?(u(t,"application/x-www-form-urlencoded;charset=utf-8"),e.toString()):o.isObject(e)||t&&"application/json"===t["Content-Type"]?(u(t,"application/json"),function(e,t,r){if(o.isString(e))try{return(t||JSON.parse)(e),o.trim(e)}catch(e){if("SyntaxError"!==e.name)throw e}return(r||JSON.stringify)(e)}(e)):e}],transformResponse:[function(e){var t=this.transitional,r=t&&t.silentJSONParsing,n=t&&t.forcedJSONParsing,i=!r&&"json"===this.responseType;if(i||n&&o.isString(e)&&e.length)try{return JSON.parse(e)}catch(e){if(i){if("SyntaxError"===e.name)throw s(e,this,"E_JSON_PARSE");throw e}}return e}],timeout:0,xsrfCookieName:"XSRF-TOKEN",xsrfHeaderName:"X-XSRF-TOKEN",maxContentLength:-1,maxBodyLength:-1,validateStatus:function(e){return e>=200&&e<300}};l.headers={common:{Accept:"application/json, text/plain, */*"}},o.forEach(["delete","get","head"],(function(e){l.headers[e]={}})),o.forEach(["post","put","patch"],(function(e){l.headers[e]=o.merge(a)})),e.exports=l},958:e=>{"use strict";e.exports=function(e,t){return function(){for(var r=new Array(arguments.length),n=0;n<r.length;n++)r[n]=arguments[n];return e.apply(t,r)}}},306:(e,t,r)=>{"use strict";var n=r(501);function o(e){return encodeURIComponent(e).replace(/%3A/gi,":").replace(/%24/g,"$").replace(/%2C/gi,",").replace(/%20/g,"+").replace(/%5B/gi,"[").replace(/%5D/gi,"]")}e.exports=function(e,t,r){if(!t)return e;var i;if(r)i=r(t);else if(n.isURLSearchParams(t))i=t.toString();else{var s=[];n.forEach(t,(function(e,t){null!=e&&(n.isArray(e)?t+="[]":e=[e],n.forEach(e,(function(e){n.isDate(e)?e=e.toISOString():n.isObject(e)&&(e=JSON.stringify(e)),s.push(o(t)+"="+o(e))})))})),i=s.join("&")}if(i){var a=e.indexOf("#");-1!==a&&(e=e.slice(0,a)),e+=(-1===e.indexOf("?")?"?":"&")+i}return e}},533:e=>{"use strict";e.exports=function(e,t){return t?e.replace(/\/+$/,"")+"/"+t.replace(/^\/+/,""):e}},233:(e,t,r)=>{"use strict";var n=r(501);e.exports=n.isStandardBrowserEnv()?{write:function(e,t,r,o,i,s){var a=[];a.push(e+"="+encodeURIComponent(t)),n.isNumber(r)&&a.push("expires="+new Date(r).toGMTString()),n.isString(o)&&a.push("path="+o),n.isString(i)&&a.push("domain="+i),!0===s&&a.push("secure"),document.cookie=a.join("; ")},read:function(e){var t=document.cookie.match(new RegExp("(^|;\\s*)("+e+")=([^;]*)"));return t?decodeURIComponent(t[3]):null},remove:function(e){this.write(e,"",Date.now()-864e5)}}:{write:function(){},read:function(){return null},remove:function(){}}},473:e=>{"use strict";e.exports=function(e){return/^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(e)}},465:e=>{"use strict";e.exports=function(e){return"object"==typeof e&&!0===e.isAxiosError}},977:(e,t,r)=>{"use strict";var n=r(501);e.exports=n.isStandardBrowserEnv()?function(){var e,t=/(msie|trident)/i.test(navigator.userAgent),r=document.createElement("a");function o(e){var n=e;return t&&(r.setAttribute("href",n),n=r.href),r.setAttribute("href",n),{href:r.href,protocol:r.protocol?r.protocol.replace(/:$/,""):"",host:r.host,search:r.search?r.search.replace(/^\?/,""):"",hash:r.hash?r.hash.replace(/^#/,""):"",hostname:r.hostname,port:r.port,pathname:"/"===r.pathname.charAt(0)?r.pathname:"/"+r.pathname}}return e=o(window.location.href),function(t){var r=n.isString(t)?o(t):t;return r.protocol===e.protocol&&r.host===e.host}}():function(){return!0}},799:(e,t,r)=>{"use strict";var n=r(501);e.exports=function(e,t){n.forEach(e,(function(r,n){n!==t&&n.toUpperCase()===t.toUpperCase()&&(e[t]=r,delete e[n])}))}},644:(e,t,r)=>{"use strict";var n=r(501),o=["age","authorization","content-length","content-type","etag","expires","from","host","if-modified-since","if-unmodified-since","last-modified","location","max-forwards","proxy-authorization","referer","retry-after","user-agent"];e.exports=function(e){var t,r,i,s={};return e?(n.forEach(e.split("\n"),(function(e){if(i=e.indexOf(":"),t=n.trim(e.substr(0,i)).toLowerCase(),r=n.trim(e.substr(i+1)),t){if(s[t]&&o.indexOf(t)>=0)return;s[t]="set-cookie"===t?(s[t]?s[t]:[]).concat([r]):s[t]?s[t]+", "+r:r}})),s):s}},363:e=>{"use strict";e.exports=function(e){return function(t){return e.apply(null,t)}}},169:(e,t,r)=>{"use strict";var n=r(837),o={};["object","boolean","number","function","string","symbol"].forEach((function(e,t){o[e]=function(r){return typeof r===e||"a"+(t<1?"n ":" ")+e}}));var i={},s=n.version.split(".");function a(e,t){for(var r=t?t.split("."):s,n=e.split("."),o=0;o<3;o++){if(r[o]>n[o])return!0;if(r[o]<n[o])return!1}return!1}o.transitional=function(e,t,r){var o=t&&a(t);function s(e,t){return"[Axios v"+n.version+"] Transitional option '"+e+"'"+t+(r?". "+r:"")}return function(r,n,a){if(!1===e)throw new Error(s(n," has been removed in "+t));return o&&!i[n]&&(i[n]=!0,console.warn(s(n," has been deprecated since v"+t+" and will be removed in the near future"))),!e||e(r,n,a)}},e.exports={isOlderVersion:a,assertOptions:function(e,t,r){if("object"!=typeof e)throw new TypeError("options must be an object");for(var n=Object.keys(e),o=n.length;o-- >0;){var i=n[o],s=t[i];if(s){var a=e[i],u=void 0===a||s(a,i,e);if(!0!==u)throw new TypeError("option "+i+" must be "+u)}else if(!0!==r)throw Error("Unknown option "+i)}},validators:o}},501:(e,t,r)=>{"use strict";var n=r(958),o=Object.prototype.toString;function i(e){return"[object Array]"===o.call(e)}function s(e){return void 0===e}function a(e){return null!==e&&"object"==typeof e}function u(e){if("[object Object]"!==o.call(e))return!1;var t=Object.getPrototypeOf(e);return null===t||t===Object.prototype}function c(e){return"[object Function]"===o.call(e)}function l(e,t){if(null!=e)if("object"!=typeof e&&(e=[e]),i(e))for(var r=0,n=e.length;r<n;r++)t.call(null,e[r],r,e);else for(var o in e)Object.prototype.hasOwnProperty.call(e,o)&&t.call(null,e[o],o,e)}e.exports={isArray:i,isArrayBuffer:function(e){return"[object ArrayBuffer]"===o.call(e)},isBuffer:function(e){return null!==e&&!s(e)&&null!==e.constructor&&!s(e.constructor)&&"function"==typeof e.constructor.isBuffer&&e.constructor.isBuffer(e)},isFormData:function(e){return"undefined"!=typeof FormData&&e instanceof FormData},isArrayBufferView:function(e){return"undefined"!=typeof ArrayBuffer&&ArrayBuffer.isView?ArrayBuffer.isView(e):e&&e.buffer&&e.buffer instanceof ArrayBuffer},isString:function(e){return"string"==typeof e},isNumber:function(e){return"number"==typeof e},isObject:a,isPlainObject:u,isUndefined:s,isDate:function(e){return"[object Date]"===o.call(e)},isFile:function(e){return"[object File]"===o.call(e)},isBlob:function(e){return"[object Blob]"===o.call(e)},isFunction:c,isStream:function(e){return a(e)&&c(e.pipe)},isURLSearchParams:function(e){return"undefined"!=typeof URLSearchParams&&e instanceof URLSearchParams},isStandardBrowserEnv:function(){return("undefined"==typeof navigator||"ReactNative"!==navigator.product&&"NativeScript"!==navigator.product&&"NS"!==navigator.product)&&("undefined"!=typeof window&&"undefined"!=typeof document)},forEach:l,merge:function e(){var t={};function r(r,n){u(t[n])&&u(r)?t[n]=e(t[n],r):u(r)?t[n]=e({},r):i(r)?t[n]=r.slice():t[n]=r}for(var n=0,o=arguments.length;n<o;n++)l(arguments[n],r);return t},extend:function(e,t,r){return l(t,(function(t,o){e[o]=r&&"function"==typeof t?n(t,r):t})),e},trim:function(e){return e.trim?e.trim():e.replace(/^\s+|\s+$/g,"")},stripBOM:function(e){return 65279===e.charCodeAt(0)&&(e=e.slice(1)),e}}},79:(e,t,r)=>{var n=r(806);function o(){return(o=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var r=arguments[t];for(var n in r)Object.prototype.hasOwnProperty.call(r,n)&&(e[n]=r[n])}return e}).apply(this,arguments)}var i=r(653),s=function(){try{return n.env.MIX_VAPOR_ASSET_URL?n.env.MIX_VAPOR_ASSET_URL:""}catch(e){throw console.error("Unable to automatically resolve the asset URL. Use Vapor.withBaseAssetUrl() to specify it manually."),e}};e.exports=new(function(){function e(){}var t=e.prototype;return t.asset=function(e){return s()+"/"+e},t.withBaseAssetUrl=function(e){s=function(){return e||""}},t.store=function(e,t){void 0===t&&(t={});try{return Promise.resolve(i.post(t.signedStorageUrl?t.signedStorageUrl:"/vapor/signed-storage-url",o({bucket:t.bucket||"",content_type:t.contentType||e.type,expires:t.expires||"",visibility:t.visibility||""},t.data),o({baseURL:t.baseURL||null,headers:t.headers||{}},t.options))).then((function(r){var n=r.data.headers;return"Host"in n&&delete n.Host,void 0===t.progress&&(t.progress=function(){}),Promise.resolve(i.put(r.data.url,e,{cancelToken:t.cancelToken||"",headers:n,onUploadProgress:function(e){t.progress(e.loaded/e.total)}})).then((function(){return r.data.extension=e.name.split(".").pop(),r.data}))}))}catch(e){return Promise.reject(e)}},e}())},806:e=>{var t,r,n=e.exports={};function o(){throw new Error("setTimeout has not been defined")}function i(){throw new Error("clearTimeout has not been defined")}function s(e){if(t===setTimeout)return setTimeout(e,0);if((t===o||!t)&&setTimeout)return t=setTimeout,setTimeout(e,0);try{return t(e,0)}catch(r){try{return t.call(null,e,0)}catch(r){return t.call(this,e,0)}}}!function(){try{t="function"==typeof setTimeout?setTimeout:o}catch(e){t=o}try{r="function"==typeof clearTimeout?clearTimeout:i}catch(e){r=i}}();var a,u=[],c=!1,l=-1;function f(){c&&a&&(c=!1,a.length?u=a.concat(u):l=-1,u.length&&p())}function p(){if(!c){var e=s(f);c=!0;for(var t=u.length;t;){for(a=u,u=[];++l<t;)a&&a[l].run();l=-1,t=u.length}a=null,c=!1,function(e){if(r===clearTimeout)return clearTimeout(e);if((r===i||!r)&&clearTimeout)return r=clearTimeout,clearTimeout(e);try{r(e)}catch(t){try{return r.call(null,e)}catch(t){return r.call(this,e)}}}(e)}}function d(e,t){this.fun=e,this.array=t}function h(){}n.nextTick=function(e){var t=new Array(arguments.length-1);if(arguments.length>1)for(var r=1;r<arguments.length;r++)t[r-1]=arguments[r];u.push(new d(e,t)),1!==u.length||c||s(p)},d.prototype.run=function(){this.fun.apply(null,this.array)},n.title="browser",n.browser=!0,n.env={},n.argv=[],n.version="",n.versions={},n.on=h,n.addListener=h,n.once=h,n.off=h,n.removeListener=h,n.removeAllListeners=h,n.emit=h,n.prependListener=h,n.prependOnceListener=h,n.listeners=function(e){return[]},n.binding=function(e){throw new Error("process.binding is not supported")},n.cwd=function(){return"/"},n.chdir=function(e){throw new Error("process.chdir is not supported")},n.umask=function(){return 0}},837:e=>{"use strict";e.exports=JSON.parse('{"name":"axios","version":"0.21.4","description":"Promise based HTTP client for the browser and node.js","main":"index.js","scripts":{"test":"grunt test","start":"node ./sandbox/server.js","build":"NODE_ENV=production grunt build","preversion":"npm test","version":"npm run build && grunt version && git add -A dist && git add CHANGELOG.md bower.json package.json","postversion":"git push && git push --tags","examples":"node ./examples/server.js","coveralls":"cat coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js","fix":"eslint --fix lib/**/*.js"},"repository":{"type":"git","url":"https://github.com/axios/axios.git"},"keywords":["xhr","http","ajax","promise","node"],"author":"Matt Zabriskie","license":"MIT","bugs":{"url":"https://github.com/axios/axios/issues"},"homepage":"https://axios-http.com","devDependencies":{"coveralls":"^3.0.0","es6-promise":"^4.2.4","grunt":"^1.3.0","grunt-banner":"^0.6.0","grunt-cli":"^1.2.0","grunt-contrib-clean":"^1.1.0","grunt-contrib-watch":"^1.0.0","grunt-eslint":"^23.0.0","grunt-karma":"^4.0.0","grunt-mocha-test":"^0.13.3","grunt-ts":"^6.0.0-beta.19","grunt-webpack":"^4.0.2","istanbul-instrumenter-loader":"^1.0.0","jasmine-core":"^2.4.1","karma":"^6.3.2","karma-chrome-launcher":"^3.1.0","karma-firefox-launcher":"^2.1.0","karma-jasmine":"^1.1.1","karma-jasmine-ajax":"^0.1.13","karma-safari-launcher":"^1.0.0","karma-sauce-launcher":"^4.3.6","karma-sinon":"^1.0.5","karma-sourcemap-loader":"^0.3.8","karma-webpack":"^4.0.2","load-grunt-tasks":"^3.5.2","minimist":"^1.2.0","mocha":"^8.2.1","sinon":"^4.5.0","terser-webpack-plugin":"^4.2.3","typescript":"^4.0.5","url-search-params":"^0.10.0","webpack":"^4.44.2","webpack-dev-server":"^3.11.0"},"browser":{"./lib/adapters/http.js":"./lib/adapters/xhr.js"},"jsdelivr":"dist/axios.min.js","unpkg":"dist/axios.min.js","typings":"./index.d.ts","dependencies":{"follow-redirects":"^1.14.0"},"bundlesize":[{"path":"./dist/axios.min.js","threshold":"5kB"}]}')}},t={};function r(n){var o=t[n];if(void 0!==o)return o.exports;var i=t[n]={exports:{}};return e[n](i,i.exports,r),i.exports}(()=>{"use strict";var e=void 0,t=function(t,r){var n={BAD_LINK:"File cannot be loaded from the passed link.",MISSING_LINK:"No link in upload response.",ERROR_DURING_UPLOAD:"Error during file upload.",BAD_RESPONSE:"Parsing response failed.",MAX_SIZE_EXCEEDED:"File is too large.",BAD_FILE_TYPE:"File file type is invalid.",NO_CORS_IE:"Files can be uploaded only to same domain in IE 8 and IE 9."},o=function(e,r){var n=t.popups.get("file.insert");if(n){var o=n.find(".fr-file-progress-bar-layer");o.find("h3").text(e+(r?" "+r+"%":"")),o.removeClass("fr-error"),r?(o.find("div").removeClass("fr-indeterminate"),o.find("div > span").css("width",r+"%")):o.find("div").addClass("fr-indeterminate")}},i=function(){var e=t.popups.get("file.insert");e||(e=u()),e.find(".fr-layer.fr-active").removeClass("fr-active").addClass("fr-pactive"),e.find(".fr-file-progress-bar-layer").addClass("fr-active"),e.find(".fr-buttons").hide(),o("Uploading",0)},s=function(){var e=t.image?t.image.getEl():null;if(e){var r=t.popups.get("link.insert");t.image.hasCaption()&&(e=e.find(".fr-img-wrap")),r||(r=u()),_refreshInsertPopup(!0),t.popups.setContainer("link.insert",t.$sc);var n=e.offset().left+e.outerWidth()/2,o=e.offset().top+e.outerHeight();t.popups.show("link.insert",n,o,e.outerHeight())}},a=function(){t.popups.hide("link.edit");var e=get();if(e){var r=t.popups.get("link.insert");r||(r=u()),t.popups.isVisible("link.insert")||(t.popups.refresh("link.insert"),t.selection.save(),t.helpers.isMobile()&&(t.events.disableBlur(),t.$el.blur(),t.events.enableBlur())),t.popups.setContainer("link.insert",t.$sc);var n=(t.image?t.image.get():null)||$(e),o=n.offset().left+n.outerWidth()/2,i=n.offset().top+n.outerHeight();t.popups.show("link.insert",o,i,n.outerHeight())}},u=function(e){if(e)return t.popups.onRefresh("link.insert",_refreshInsertPopup),t.popups.onHide("link.insert",_hideInsertPopup),!0;var r="";t.opts.linkInsertButtons.length>=1&&(r='<div class="fr-buttons">'+t.button.buildList(t.opts.linkInsertButtons)+"</div>");var n="",o=0;for(var i in n='<div class="fr-link-insert-layer fr-layer fr-active" id="fr-link-insert-layer-'+t.id+'">',n+='<div class="fr-input-line"><input id="fr-link-insert-layer-url-'+t.id+'" name="href" type="text" class="fr-link-attr" placeholder="'+t.language.translate("URL")+'" tabIndex="'+ ++o+'"></div>',t.opts.linkText&&(n+='<div class="fr-input-line"><input id="fr-link-insert-layer-text-'+t.id+'" name="text" type="text" class="fr-link-attr" placeholder="'+t.language.translate("Text")+'" tabIndex="'+ ++o+'"></div>'),t.opts.linkAttributes)if(t.opts.linkAttributes.hasOwnProperty(i)){var u=t.opts.linkAttributes[i];n+='<div class="fr-input-line"><input name="'+i+'" type="text" class="fr-link-attr" placeholder="'+t.language.translate(u)+'" tabIndex="'+ ++o+'"></div>'}t.opts.linkAlwaysBlank||(n+='<div class="fr-checkbox-line"><span class="fr-checkbox"><input name="target" class="fr-link-attr" data-checked="_blank" type="checkbox" id="fr-link-target-'+t.id+'" tabIndex="'+ ++o+'"><span><svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="10" height="10" viewBox="0 0 32 32"><path d="M27 4l-15 15-7-7-5 5 12 12 20-20z" fill="#FFF"></path></svg></span></span><label for="fr-link-target-'+t.id+'">'+t.language.translate("Open in new tab")+"</label></div>");var c={buttons:r,input_layer:n+='<div class="fr-action-buttons"><button class="fr-command fr-submit" role="button" data-cmd="linkInsert" href="#" tabIndex="'+ ++o+'" type="button">'+t.language.translate("Insert")+"</button></div></div>"},l=t.popups.create("link.insert",c);return t.$wp&&t.events.$on(t.$wp,"scroll.link-insert",(function(){(t.image?t.image.get():null)&&t.popups.isVisible("link.insert")&&s(),get&&t.popups.isVisible("link.insert")&&a()})),l},c=function(e,r,n){var o=r.status,i=r.response,s=(r.responseXML,r.responseText);try{if(o>=200&&o<300){var a=function(e){try{if(!1===t.events.trigger("file.uploaded",[e],!0))return t.edit.on(),!1;var r=$.parseJSON(e);return r.link?r:(f(2,e),!1)}catch(t){return f(4,e),!1}}(s);if(a)if("image"===e)t.image.insert(a.link,n,i||s);else t.file.insert(a.link,n,i||s)}else f(3,i||s)}catch(e){f(4,i||s)}},l=function(e){if(e.lengthComputable){var t=e.loaded/e.total*100|0;o("Uploading",t)}else e&&o("Uploading",e)},f=function(e,r){t.edit.on(),function(e){i();var r=t.popups.get("file.insert");if(r){var n=r.find(".fr-file-progress-bar-layer");n.addClass("fr-error");var o=n.find("h3");o.text(e),t.events.disableBlur(),o.focus()}else alert(e)}(t.language.translate("Something went wrong. Please try again.")),t.events.trigger("file.error",[{code:e,message:n[e]},r])},p=function(){f(4,e.response||e.responseText||e.responseXML)},d=function(){var e,r;t.edit.on(),e=!0,(r=t.popups.get("file.insert"))&&(r.find(".fr-layer.fr-pactive").addClass("fr-active").removeClass("fr-pactive"),r.find(".fr-file-progress-bar-layer").removeClass("fr-active"),r.find(".fr-buttons").show(),e&&(t.events.focus(),t.popups.hide("file.insert")))},h=function(e){return function(n){if(void 0===n&&1!==n.length)return!1;if(!1===t.events.trigger("file.beforeUpload",[n]))return!1;var o=n[0];return o.size>t.opts.fileMaxSize?(f(5),!1):t.opts.fileAllowedTypes.indexOf("*")<0&&t.opts.fileAllowedTypes.indexOf(o.type.replace(/file\//g,""))<0?(f(6),!1):void r(o,(function(e){l(e)})).then((function(r){var n,s=t.core.getXHR(t.opts.fileUploadURL,t.opts.fileUploadMethod),a={uuid:r.uuid,key:r.key,bucket:r.bucket,name:o.name,content_type:o.type},u=new FormData;for(n in void 0!==t.opts.uploadHandler&&u.append("_handler",t.opts.uploadHandler),a)u.append(n,a[n]);s.onload=function(){c(e,s,o.name)},s.onerror=p,s.upload.onprogress=l,s.onabort=d,i(),t.edit.off();var f=t.popups.get("file.insert");f&&f.off("abortUpload").on("abortUpload",(function(){4!=s.readyState&&s.abort()})),s.send(u)}))}};t.image.upload=h("image"),t.file.upload=h("file")};function n(e){return n="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},n(e)}function o(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function i(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}function s(e,t){return s=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(e,t){return e.__proto__=t,e},s(e,t)}function a(e){var t=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(e){return!1}}();return function(){var r,n=c(e);if(t){var o=c(this).constructor;r=Reflect.construct(n,arguments,o)}else r=n.apply(this,arguments);return u(this,r)}}function u(e,t){if(t&&("object"===n(t)||"function"==typeof t))return t;if(void 0!==t)throw new TypeError("Derived constructors may only return object or undefined");return function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}(e)}function c(e){return c=Object.setPrototypeOf?Object.getPrototypeOf.bind():function(e){return e.__proto__||Object.getPrototypeOf(e)},c(e)}var l=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),Object.defineProperty(e,"prototype",{writable:!1}),t&&s(e,t)}(f,Snowboard.Singleton);var n,u,c,l=a(f);function f(){return o(this,f),l.apply(this,arguments)}return n=f,u=[{key:"listens",value:function(){return{mediaManagerInitUploader:"mediaManager",fileUploadInitUploader:"fileUpload",richEditorInit:"richEditor"}}},{key:"vaporHandler",value:function(e,t){return r(79).store(e,{expires:5,signedStorageUrl:window.location.pathname,data:{size:e.size},headers:{"X-WINTER-REQUEST-HANDLER":"onSignUrl","X-CSRF-TOKEN":$('meta[name="csrf-token"]').attr("content"),"X-Requested-With":"XMLHttpRequest"},progress:t})}},{key:"mediaManager",value:function(e){this.dropzoneHandle(e)}},{key:"fileUpload",value:function(e){this.dropzoneHandle(e)}},{key:"richEditor",value:function(e){t(e.editor,this.vaporHandler)}},{key:"dropzoneHandle",value:function(e){var t=this;e.dropzone._uploadData=function(e,r){var n=this,o=function(r){if(!e.hasOwnProperty(r))return"continue";var o=e[r];t.vaporHandler(o,(function(e){n.emit("totaluploadprogress",100*e)})).then((function(t){var i,s=new XMLHttpRequest,a=n.resolveOption(n.options.method,e),u=n.resolveOption(n.options.url,e),c={uuid:t.uuid,key:t.key,bucket:t.bucket,name:e[r].name,content_type:e[r].type};s.open(a,u,!0),s.timeout=n.resolveOption(n.options.timeout,e),s.withCredentials=!!n.options.withCredentials,s.onload=function(t){n._finishedUploading(e,s,t)},s.onerror=function(){n._handleUploadError(e,s)},(null!=s.upload?s.upload:s).onprogress=function(t){return n._updateFilesUploadProgress(e,s,t)};var l={Accept:"application/json","Cache-Control":"no-cache","X-Requested-With":"XMLHttpRequest"};for(var f in n.options.headers&&Dropzone.extend(l,n.options.headers),l){var p=l[f];p&&s.setRequestHeader(f,p)}var d=new FormData;if(n.options.params){var h=n.options.params;for(i in"function"==typeof h&&(h=h.call(n,e,s,e[0].upload.chunked?n._getChunk(e[0],s):null)),h)d.append(i,h[i])}for(i in c)d.append(i,c[i]);n.emit("sending",o,s,d),n.options.uploadMultiple&&n.emit("sendingmultiple",e,s,d),n._addFormElementData(d),n.submitRequest(s,d,e)}))};for(var i in e)o(i)}}}],u&&i(n.prototype,u),c&&i(n,c),Object.defineProperty(n,"prototype",{writable:!1}),f}();window.Snowboard.addPlugin("driveraws.streamFileUpload",l)})()})();