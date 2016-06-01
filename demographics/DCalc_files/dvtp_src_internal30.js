function dv_rolloutManager(handlersDefsArray, baseHandler) {
    this.handle = function () {
        var errorsArr = [];

        var handler = chooseEvaluationHandler(handlersDefsArray);
        if (handler) {
            var errorObj = handleSpecificHandler(handler);
            if (errorObj === null)
                return errorsArr;
            else {
                var debugInfo = handler.onFailure();
                if (debugInfo) {
                    for (var key in debugInfo) {
                        if (debugInfo.hasOwnProperty(key)) {
                            if (debugInfo[key] !== undefined || debugInfo[key] !== null) {
                                errorObj[key] = encodeURIComponent(debugInfo[key]);
                            }
                        }
                    }
                }
                errorsArr.push(errorObj);
            }
        }

        var errorObjHandler = handleSpecificHandler(baseHandler);
        if (errorObjHandler) {
            errorObjHandler['dvp_isLostImp'] = 1;
            errorsArr.push(errorObjHandler);
        }
        return errorsArr;
    }

    function handleSpecificHandler(handler) {
        var url;
        var errorObj = null;

        try {
            url = handler.createRequest();
            if (url) {
                if (!handler.sendRequest(url))
                    errorObj = createAndGetError('sendRequest failed.', url, handler.getVersion(), handler.getVersionParamName(), handler.dv_script);
            }
            else
                errorObj = createAndGetError('createRequest failed.', url, handler.getVersion(), handler.getVersionParamName(), handler.dv_script);
        }
        catch (e) {
            errorObj = createAndGetError(e.name + ': ' + e.message, url, handler.getVersion(), handler.getVersionParamName(), (handler ? handler.dv_script : null));
        }

        return errorObj;
    }

    function createAndGetError(error, url, ver, versionParamName, dv_script) {
        var errorObj = {};
        errorObj[versionParamName] = ver;
        errorObj['dvp_jsErrMsg'] = encodeURIComponent(error);
        if (dv_script && dv_script.parentElement && dv_script.parentElement.tagName && dv_script.parentElement.tagName == 'HEAD')
            errorObj['dvp_isOnHead'] = '1';
        if (url)
            errorObj['dvp_jsErrUrl'] = url;
        return errorObj;
    }

    function chooseEvaluationHandler(handlersArray) {
        var config = window._dv_win.dv_config;
        var index = 0;
        var isEvaluationVersionChosen = false;
        if (config.handlerVersionSpecific) {
            for (var i = 0; i < handlersArray.length; i++) {
                if (handlersArray[i].handler.getVersion() == config.handlerVersionSpecific) {
                    isEvaluationVersionChosen = true;
                    index = i;
                    break;
                }
            }
        }
        else if (config.handlerVersionByTimeIntervalMinutes) {
            var date = config.handlerVersionByTimeInputDate || new Date();
            var hour = date.getUTCHours();
            var minutes = date.getUTCMinutes();
            index = Math.floor(((hour * 60) + minutes) / config.handlerVersionByTimeIntervalMinutes) % (handlersArray.length + 1);
            if (index != handlersArray.length) //This allows a scenario where no evaluation version is chosen
                isEvaluationVersionChosen = true;
        }
        else {
            var rand = config.handlerVersionRandom || (Math.random() * 100);
            for (var i = 0; i < handlersArray.length; i++) {
                if (rand >= handlersArray[i].minRate && rand < handlersArray[i].maxRate) {
                    isEvaluationVersionChosen = true;
                    index = i;
                    break;
                }
            }
        }

        if (isEvaluationVersionChosen == true && handlersArray[index].handler.isApplicable())
            return handlersArray[index].handler;
        else
            return null;
    }    
}

function getCurrentTime() {
    "use strict";
    if (Date.now) {
        return Date.now();
    }
    return (new Date()).getTime();
}

function doesBrowserSupportHTML5Push() {
    "use strict";
    return typeof window.parent.postMessage === 'function' && window.JSON;
}

function dv_GetParam(url, name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS, 'i');
    var results = regex.exec(url);
    if (results == null)
        return null;
    else
        return results[1];
}

function dv_GetKeyValue(url) {
    var keyReg = new RegExp(".*=");
    var keyRet = url.match(keyReg)[0];
    keyRet = keyRet.replace("=", "");

    var valReg = new RegExp("=.*");
    var valRet = url.match(valReg)[0];
    valRet = valRet.replace("=", "");

    return { key: keyRet, value: valRet };
}

function dv_Contains(array, obj) {
    var i = array.length;
    while (i--) {
        if (array[i] === obj) {
            return true;
        }
    }
    return false;
}

function dv_GetDynamicParams(url, prefix) {
    try {
        prefix = (prefix != undefined && prefix != null) ? prefix : 'dvp';
        var regex = new RegExp("[\\?&](" + prefix + "_[^&]*=[^&#]*)", "gi");
        var dvParams = regex.exec(url);

        var results = [];
        while (dvParams != null) {
            results.push(dvParams[1]);
            dvParams = regex.exec(url);
        }
        return results;
    }
    catch (e) {
        return [];
    }
}

function dv_createIframe() {
    var iframe;
    if (document.createElement && (iframe = document.createElement('iframe'))) {
        iframe.name = iframe.id = 'iframe_' + Math.floor((Math.random() + "") * 1000000000000);
        iframe.width = 0;
        iframe.height = 0;
        iframe.style.display = 'none';
        iframe.src = 'about:blank';
    }

    return iframe;
}

function dv_GetRnd() {
    return ((new Date()).getTime() + "" + Math.floor(Math.random() * 1000000)).substr(0, 16);
}

function dv_SendErrorImp(serverUrl, errorsArr) {

    for (var j = 0; j < errorsArr.length; j++) {
        var errorObj = errorsArr[j];
        var errorImp = dv_CreateAndGetErrorImp(serverUrl, errorObj);
        dv_sendImgImp(errorImp);
    }
}

function dv_CreateAndGetErrorImp(serverUrl, errorObj) {
    var errorQueryString = '';
    for (var key in errorObj) {
        if (errorObj.hasOwnProperty(key)) {
            if (key.indexOf('dvp_jsErrUrl') == -1) {
                errorQueryString += '&' + key + '=' + errorObj[key];
            } else {
                var params = ['ctx', 'cmp', 'plc', 'sid'];
                for (var i = 0; i < params.length; i++) {
                    var pvalue = dv_GetParam(errorObj[key], params[i]);
                    if (pvalue) {
                        errorQueryString += '&dvp_js' + params[i] + '=' + pvalue;
                    }
                }
            }
        }
    }

    var windowProtocol = 'http:';
    var sslFlag = '&ssl=0';
    if (window._dv_win.location.protocol === 'https:') {
        windowProtocol = 'https:';
        sslFlag = '&ssl=1';
    }

    var errorImp = windowProtocol + '//' + serverUrl + sslFlag + errorQueryString;
    return errorImp;
}

function dv_sendImgImp(url) {
    (new Image()).src = url;
}

function dv_getPropSafe(obj, propName) {
    try {
        if (obj)
            return obj[propName];
    } catch (e) {
    }
}

function dvType() {
    var that = this;
    var eventsForDispatch = {};
    this.t2tEventDataZombie = {};

    this.processT2TEvent = function (data, tag) {
        try {
            if (tag.ServerPublicDns) {
                var tpsServerUrl = tag.dv_protocol + '//' + tag.ServerPublicDns + '/event.gif?impid=' + tag.uid;

                if (!tag.uniquePageViewId) {
                    tag.uniquePageViewId = data.uniquePageViewId;
                }

                tpsServerUrl += '&upvid=' + tag.uniquePageViewId;
                $dv.domUtilities.addImage(tpsServerUrl, tag.tagElement.parentElement);
            }
        } catch (e) {
            try {
                dv_SendErrorImp(window._dv_win.dv_config.tpsErrAddress + '/visit.jpg?ctx=818052&cmp=1619415&dvtagver=6.1.src&jsver=0&dvp_ist2tProcess=1', {dvp_jsErrMsg: encodeURIComponent(e)});
            } catch (ex) {
            }
        }
    };

    this.processTagToTagCollision = function (collision, tag) {
        var i;
        for (i = 0; i < collision.eventsToFire.length; i++) {
            this.pubSub.publish(collision.eventsToFire[i], tag.uid);
        }
        var tpsServerUrl = tag.dv_protocol + '//' + tag.ServerPublicDns + '/event.gif?impid=' + tag.uid;
        tpsServerUrl += '&colltid=' + collision.allReasonsForTagBitFlag;

        for (i = 0; i < collision.reasons.length; i++) {
            var reason = collision.reasons[i];
            tpsServerUrl += '&' + reason.name + "ms=" + reason.milliseconds;
        }

        if (collision.thisTag) {
            tpsServerUrl += '&tlts=' + collision.thisTag.t2tLoadTime;
        }
        if (tag.uniquePageViewId) {
            tpsServerUrl += '&upvid=' + tag.uniquePageViewId;
        }
        $dv.domUtilities.addImage(tpsServerUrl, tag.tagElement.parentElement);
    };

    this.processBSIdFound = function (bsID, tag) {
        var tpsServerUrl = tag.dv_protocol + '//' + tag.ServerPublicDns + '/event.gif?impid=' + tag.uid;
        tpsServerUrl += '&bsimpid=' + bsID;
        if (tag.uniquePageViewId) {
            tpsServerUrl += '&upvid=' + tag.uniquePageViewId;
        }
        $dv.domUtilities.addImage(tpsServerUrl, tag.tagElement.parentElement);
    };

    this.processBABSVerbose = function (verboseReportingValues, tag) {
        var queryString = "";
        //get each frame, translate


        var dvpPrepend = "&dvp_BABS_";
        queryString += dvpPrepend + 'NumBS=' + verboseReportingValues.bsTags.length;

        for (var i = 0; i < verboseReportingValues.bsTags.length; i++) {
            var thisFrame = verboseReportingValues.bsTags[i];

            queryString += dvpPrepend + 'GotCB' + i + '=' + thisFrame.callbackReceived;
            queryString += dvpPrepend + 'Depth' + i + '=' + thisFrame.depth;

            if (thisFrame.callbackReceived) {
                if (thisFrame.bsAdEntityInfo && thisFrame.bsAdEntityInfo.comparisonItems) {
                    for (var itemIndex = 0; itemIndex < thisFrame.bsAdEntityInfo.comparisonItems.length; itemIndex++) {
                        var compItem = thisFrame.bsAdEntityInfo.comparisonItems[itemIndex];
                        queryString += dvpPrepend + "tag" + i + "_" + compItem.name + '=' + compItem.value;
                    }
                }
            }
        }

        if (queryString.length > 0) {
            var tpsServerUrl = '';
            if (tag) {
                var tpsServerUrl = tag.dv_protocol + '//' + tag.ServerPublicDns + '/event.gif?impid=' + tag.uid;
            }
            var requestString = tpsServerUrl + queryString;
            $dv.domUtilities.addImage(requestString, tag.tagElement.parentElement);
        }
    };

    var messageEventListener = function (event) {
        try {
            var timeCalled = getCurrentTime();
            var data = window.JSON.parse(event.data);
            if (!data.action) {
                data = window.JSON.parse(data);
            }
            var myUID;
            var visitJSHasBeenCalledForThisTag = false;
            if ($dv.tags) {
                for (var uid in $dv.tags) {
                    if ($dv.tags.hasOwnProperty(uid) && $dv.tags[uid] && $dv.tags[uid].t2tIframeId === data.iFrameId) {
                        myUID = uid;
                        visitJSHasBeenCalledForThisTag = true;
                        break;
                    }
                }
            }

            var tag;
            switch (data.action) {
                case 'uniquePageViewIdDetermination':
                    if (visitJSHasBeenCalledForThisTag) {
                        $dv.processT2TEvent(data, $dv.tags[myUID]);
                        $dv.t2tEventDataZombie[data.iFrameId] = undefined;
                    }
                    else {
                        data.wasZombie = 1;
                        $dv.t2tEventDataZombie[data.iFrameId] = data;
                    }
                    break;
                case 'maColl':
                    tag = $dv.tags[myUID];
                    if (!tag.uniquePageViewId) {
                        tag.uniquePageViewId = data.uniquePageViewId;
                    }
                    data.collision.commonRecievedTS = timeCalled;
                    $dv.processTagToTagCollision(data.collision, tag);
                    break;
                case 'bsIdFound':
                    tag = $dv.tags[myUID];
                    if (!tag.uniquePageViewId) {
                        tag.uniquePageViewId = data.uniquePageViewId;
                    }
                    $dv.processBSIdFound(data.id, tag);
                    break;
                case 'babsVerbose':
                    try {
                        tag = $dv.tags[myUID];
                        $dv.processBABSVerbose(data, tag);
                    } catch (err) {
                    }
                    break;
            }

        } catch (e) {
            try {
                dv_SendErrorImp(window._dv_win.dv_config.tpsErrAddress + '/visit.jpg?ctx=818052&cmp=1619415&dvtagver=6.1.src&jsver=0&dvp_ist2tListener=1', {dvp_jsErrMsg: encodeURIComponent(e)});
            } catch (ex) {
            }
        }
    };

    if (window.addEventListener)
        addEventListener("message", messageEventListener, false);
    else
        attachEvent("onmessage", messageEventListener);

    this.pubSub = new function () {

        var subscribers = [];

        this.subscribe = function (eventName, uid, actionName, func) {
            if (!subscribers[eventName + uid])
                subscribers[eventName + uid] = [];
            subscribers[eventName + uid].push({Func: func, ActionName: actionName});
        };

        this.publish = function (eventName, uid) {
            var actionsResults = [];
            if (eventName && uid && subscribers[eventName + uid] instanceof Array)
                for (var i = 0; i < subscribers[eventName + uid].length; i++) {
                    var funcObject = subscribers[eventName + uid][i];
                    if (funcObject && funcObject.Func && typeof funcObject.Func == "function" && funcObject.ActionName) {
                        var isSucceeded = runSafely(function () {
                            return funcObject.Func(uid);
                        });
                        actionsResults.push(encodeURIComponent(funcObject.ActionName) + '=' + (isSucceeded ? '1' : '0'));
                    }
                }
            return actionsResults.join('&');
        };
    };

    this.domUtilities = new function () {
        function getDefaultParent() {
            return document.body || document.head || document.documentElement;
        }

        this.addImage = function (url, parentElement) {
            parentElement = parentElement || getDefaultParent();
            var image = parentElement.ownerDocument.createElement("img");
            image.width = 0;
            image.height = 0;
            image.style.display = 'none';
            image.src = appendCacheBuster(url);
            parentElement.insertBefore(image, parentElement.firstChild);

        };

        this.addScriptResource = function (url, parentElement) {
            parentElement = parentElement || getDefaultParent();
            var scriptElem = parentElement.ownerDocument.createElement("script");
            scriptElem.type = 'text/javascript';
            scriptElem.src = appendCacheBuster(url);
            parentElement.insertBefore(scriptElem, parentElement.firstChild);
        };

        this.addScriptCode = function (srcCode, parentElement) {
            parentElement = parentElement || getDefaultParent();
            var scriptElem = parentElement.ownerDocument.createElement("script");
            scriptElem.type = 'text/javascript';
            scriptElem.innerHTML = srcCode;
            parentElement.insertBefore(scriptElem, parentElement.firstChild);
        };

        this.addHtml = function (srcHtml, parentElement) {
            parentElement = parentElement || getDefaultParent();
            var divElem = parentElement.ownerDocument.createElement("div");
            divElem.style = "display: inline";
            divElem.innerHTML = srcHtml;
            parentElement.insertBefore(divElem, parentElement.firstChild);
        }
    };

    this.resolveMacros = function (str, tag) {
        var viewabilityData = tag.getViewabilityData();
        var viewabilityBuckets = viewabilityData && viewabilityData.buckets ? viewabilityData.buckets : {};
        var upperCaseObj = objectsToUpperCase(tag, viewabilityData, viewabilityBuckets);
        var newStr = str.replace('[DV_PROTOCOL]', upperCaseObj.DV_PROTOCOL);
        newStr = newStr.replace('[PROTOCOL]', upperCaseObj.PROTOCOL);
        newStr = newStr.replace(/\[(.*?)\]/g, function (match, p1) {
            var value = upperCaseObj[p1];
            if (value === undefined || value === null)
                value = '[' + p1 + ']';
            return encodeURIComponent(value);
        });
        return newStr;
    };

    this.settings = new function () {
    };

    this.tagsType = function () {
    };

    this.tagsPrototype = function () {
        this.add = function (tagKey, obj) {
            if (!that.tags[tagKey])
                that.tags[tagKey] = new that.tag();
            for (var key in obj)
                that.tags[tagKey][key] = obj[key];
        }
    };

    this.tagsType.prototype = new this.tagsPrototype();
    this.tagsType.prototype.constructor = this.tags;
    this.tags = new this.tagsType();

    this.tag = function () {
    }
    this.tagPrototype = function () {
        this.set = function (obj) {
            for (var key in obj)
                this[key] = obj[key];
        };

        this.getViewabilityData = function () {
        };
    };

    this.tag.prototype = new this.tagPrototype();
    this.tag.prototype.constructor = this.tag;

    this.registerEventCall = function (impressionId, eventObject, timeoutMs, isRegisterEnabled) {
        if (typeof isRegisterEnabled !== 'undefined' && isRegisterEnabled === true) {
            addEventCallForDispatch(impressionId, eventObject);

            if (typeof timeoutMs === 'undefined' || timeoutMs == 0 || isNaN(timeoutMs))
                dispatchEventCallsNow(impressionId, eventObject);
            else {
                if (timeoutMs > 2000)
                    timeoutMs = 2000;

                var that = this;
                setTimeout(
                    function () {
                        that.dispatchEventCalls(impressionId);
                    }, timeoutMs);
            }

        } else {
            var url = this.tags[impressionId].protocol + '//' + this.tags[impressionId].ServerPublicDns + "/event.gif?impid=" + impressionId + '&' + createQueryStringParams(eventObject);
            this.domUtilities.addImage(url, this.tags[impressionId].tagElement.parentNode);
        }
    };
    var mraidObjectCache;
    this.getMraid = function () {
        var context = window._dv_win || window;
        var iterationCounter = 0;
        var maxIterations = 20;

        function getMraidRec (context) {
            iterationCounter++;
            var isTopWindow = context.parent == context;
            if (context.mraid || isTopWindow) {
                return context.mraid;
            } else {
                return ( iterationCounter <= maxIterations ) && getMraidRec(context.parent);
            }
        }

        try {
            return mraidObjectCache = mraidObjectCache || getMraidRec(context);
        } catch (e) {
        }
    };

    var dispatchEventCallsNow = function (impressionId, eventObject) {
        addEventCallForDispatch(impressionId, eventObject);
        dispatchEventCalls(impressionId);
    };

    var addEventCallForDispatch = function (impressionId, eventObject) {
        for (var key in eventObject) {
            if (typeof eventObject[key] !== 'function' && eventObject.hasOwnProperty(key)) {
                if (!eventsForDispatch[impressionId])
                    eventsForDispatch[impressionId] = {};
                eventsForDispatch[impressionId][key] = eventObject[key];
            }
        }
    };

    this.dispatchRegisteredEventsFromAllTags = function () {
        for (var impressionId in this.tags) {
            if (typeof this.tags[impressionId] !== 'function' && typeof this.tags[impressionId] !== 'undefined')
                this.dispatchEventCalls(impressionId);
        }
    };

    this.dispatchEventCalls = function (impressionId) {
        if (typeof eventsForDispatch[impressionId] !== 'undefined' && eventsForDispatch[impressionId] != null) {
            var url = this.tags[impressionId].protocol + '//' + this.tags[impressionId].ServerPublicDns + "/event.gif?impid=" + impressionId + '&' + createQueryStringParams(eventsForDispatch[impressionId]);
            this.domUtilities.addImage(url, this.tags[impressionId].tagElement.parentElement);
            eventsForDispatch[impressionId] = null;
        }
    };


    if (window.addEventListener) {
        window.addEventListener('unload', function () {
            that.dispatchRegisteredEventsFromAllTags();
        }, false);
        window.addEventListener('beforeunload', function () {
            that.dispatchRegisteredEventsFromAllTags();
        }, false);
    }
    else if (window.attachEvent) {
        window.attachEvent('onunload', function () {
            that.dispatchRegisteredEventsFromAllTags();
        }, false);
        window.attachEvent('onbeforeunload', function () {
            that.dispatchRegisteredEventsFromAllTags();
        }, false);
    }
    else {
        window.document.body.onunload = function () {
            that.dispatchRegisteredEventsFromAllTags();
        };
        window.document.body.onbeforeunload = function () {
            that.dispatchRegisteredEventsFromAllTags();
        };
    }

    var createQueryStringParams = function (values) {
        var params = '';
        for (var key in values) {
            if (typeof values[key] !== 'function') {
                var value = encodeURIComponent(values[key]);
                if (params === '')
                    params += key + '=' + value;
                else
                    params += '&' + key + '=' + value;
            }
        }

        return params;
    };

    this.Enums = {
        BrowserId: {Others: 0, IE: 1, Firefox: 2, Chrome: 3, Opera: 4, Safari: 5},
        TrafficScenario: {OnPage: 1, SameDomain: 2, CrossDomain: 128}
    };

    this.CommonData = {};

    var runSafely = function (action) {
        try {
            var ret = action();
            return ret !== undefined ? ret : true;
        } catch (e) {
            return false;
        }
    };

    var objectsToUpperCase = function () {
        var upperCaseObj = {};
        for (var i = 0; i < arguments.length; i++) {
            var obj = arguments[i];
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    upperCaseObj[key.toUpperCase()] = obj[key];
                }
            }
        }
        return upperCaseObj;
    };

    var appendCacheBuster = function (url) {
        if (url !== undefined && url !== null && url.match("^http") == "http") {
            if (url.indexOf('?') !== -1) {
                if (url.slice(-1) == '&')
                    url += 'cbust=' + dv_GetRnd();
                else
                    url += '&cbust=' + dv_GetRnd();
            }
            else
                url += '?cbust=' + dv_GetRnd();
        }
        return url;
    };
}

function dv_baseHandler(){function L(d){if(window._dv_win.document.body)return window._dv_win.document.body.insertBefore(d,window._dv_win.document.body.firstChild),!0;var a=0,c=function(){if(window._dv_win.document.body)try{window._dv_win.document.body.insertBefore(d,window._dv_win.document.body.firstChild)}catch(e){}else a++,150>a&&setTimeout(c,20)};setTimeout(c,20);return!1}function ca(d){var a;if(document.createElement&&(a=document.createElement("iframe")))a.name=a.id=window._dv_win.dv_config.emptyIframeID||
"iframe_"+Math.floor(1E12*(Math.random()+"")),a.width=0,a.height=0,a.style.display="none",a.src=d;return a}function wa(d){var a={};try{for(var c=RegExp("[\\?&]([^&]*)=([^&#]*)","gi"),e=c.exec(d);null!=e;)"eparams"!==e[1]&&(a[e[1]]=e[2]),e=c.exec(d);return a}catch(f){return a}}function Ta(d){try{if(1>=d.depth)return{url:"",depth:""};var a,c=[];c.push({win:window._dv_win.top,depth:0});for(var e,f=1,C=0;0<f&&100>C;){try{if(C++,e=c.shift(),f--,0<e.win.location.toString().length&&e.win!=d)return 0==e.win.document.referrer.length||
0==e.depth?{url:e.win.location,depth:e.depth}:{url:e.win.document.referrer,depth:e.depth-1}}catch(L){}a=e.win.frames.length;for(var x=0;x<a;x++)c.push({win:e.win.frames[x],depth:e.depth+1}),f++}return{url:"",depth:""}}catch(D){return{url:"",depth:""}}}function da(d){var a=String(),c,e,f;for(c=0;c<d.length;c++)f=d.charAt(c),e="!\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~".indexOf(f),0<=e&&(f="!\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~".charAt((e+
47)%94)),a+=f;return a}function Ua(){try{if("function"===typeof window.callPhantom)return 99;try{if("function"===typeof window.top.callPhantom)return 99}catch(d){}if(void 0!=window.opera&&void 0!=window.history.navigationMode||void 0!=window.opr&&void 0!=window.opr.addons&&"function"==typeof window.opr.addons.installExtension)return 4;if(void 0!=window.chrome&&"function"==typeof window.chrome.csi&&"function"==typeof window.chrome.loadTimes&&void 0!=document.webkitHidden&&(!0==document.webkitHidden||
!1==document.webkitHidden))return 3;if(void 0!=window.mozInnerScreenY&&"number"==typeof window.mozInnerScreenY&&void 0!=window.mozPaintCount&&0<=window.mozPaintCount&&void 0!=window.InstallTrigger&&void 0!=window.InstallTrigger.install)return 2;if(void 0!=document.uniqueID&&"string"==typeof document.uniqueID&&(void 0!=document.documentMode&&0<=document.documentMode||void 0!=document.all&&"object"==typeof document.all||void 0!=window.ActiveXObject&&"function"==typeof window.ActiveXObject)||window.document&&
window.document.updateSettings&&"function"==typeof window.document.updateSettings)return 1;var a=!1;try{var c=document.createElement("p");c.innerText=".";c.style="text-shadow: rgb(99, 116, 171) 20px -12px 2px";a=void 0!=c.style.textShadow}catch(e){}return 0<Object.prototype.toString.call(window.HTMLElement).indexOf("Constructor")&&a&&void 0!=window.innerWidth&&void 0!=window.innerHeight?5:0}catch(f){return 0}}this.createRequest=function(){var d,a,c;window._dv_win.$dv.DebugInfo={};var e=!1,f=window._dv_win,
C=0,xa=!1,x=getCurrentTime();window._dv_win.t2tTimestampData=[{dvTagCreated:x}];var D;try{for(D=0;10>=D;D++)if(null!=f.parent&&f.parent!=f)if(0<f.parent.location.toString().length)f=f.parent,C++,e=!0;else{e=!1;break}else{0==D&&(e=!0);break}}catch(gb){e=!1}var E;0==f.document.referrer.length?E=f.location:e?E=f.location:(E=f.document.referrer,xa=!0);var ya="",ea=null,fa=null;try{window._dv_win.external&&(ea=void 0!=window._dv_win.external.QueuePageID?window._dv_win.external.QueuePageID:null,fa=void 0!=
window._dv_win.external.CrawlerUrl?window._dv_win.external.CrawlerUrl:null)}catch(hb){ya="&dvp_extErr=1"}if(!window._dv_win._dvScriptsInternal||!window._dv_win.dvProcessed||0==window._dv_win._dvScriptsInternal.length)return null;var M=window._dv_win._dvScriptsInternal.pop(),y=M.script;this.dv_script_obj=M;this.dv_script=y;window._dv_win.t2tTimestampData[0].dvWrapperLoadTime=M.loadtime;window._dv_win.dvProcessed.push(M);var b=y.src,r,Va="https:"===window._dv_win.location.protocol?"https:":"http:",
ga=!0,ha=window.parent.postMessage&&window.JSON,za=!1;if("0"==dv_GetParam(b,"t2te")||window._dv_win.dv_config&&!0===window._dv_win.dv_config.supressT2T)za=!0;if(ha&&!1===za)try{r=ca(window._dv_win.dv_config.t2turl||"https://cdn3.doubleverify.com/t2tv7.html"),ga=L(r)}catch(ib){}window._dv_win.$dv.DebugInfo.dvp_HTML5=ha?"1":"0";var N=dv_GetParam(b,"region")||"",ia="http:",Aa="0";"https"==b.match("^https")&&"https"==window._dv_win.location.toString().match("^https")&&(ia="https:",Aa="1");try{for(var Wa=
f,ja=f,ka=0;10>ka&&ja!=window._dv_win.top;)ka++,ja=ja.parent;Wa.depth=ka;var Ba=Ta(f);dv_aUrlParam="&aUrl="+encodeURIComponent(Ba.url);dv_aUrlDepth="&aUrlD="+Ba.depth;dv_referrerDepth=f.depth+C;xa&&f.depth--}catch(jb){dv_aUrlDepth=dv_aUrlParam=dv_referrerDepth=f.depth=""}for(var Ca=dv_GetDynamicParams(b,"dvp"),O=dv_GetDynamicParams(b,"dvpx"),P=0;P<O.length;P++){var Da=dv_GetKeyValue(O[P]);O[P]=Da.key+"="+encodeURIComponent(Da.value)}"41"==N&&(N=50>100*Math.random()?"41":"8",Ca.push("dvp_region="+
N));var Ea=Ca.join("&"),Fa=O.join("&"),Xa=window._dv_win.dv_config.tpsAddress||"tps"+N+".doubleverify.com",F="visit.js";switch(dv_GetParam(b,"dvapi")){case "1":F="dvvisit.js";break;case "5":F="query.js";break;default:F="visit.js"}window._dv_win.$dv.DebugInfo.dvp_API=F;for(var Q="ctx cmp ipos sid plc adid crt btreg btadsrv adsrv advid num pid crtname unit chnl uid scusrid tagtype sr dt isdvvid dup".split(" "),la=[],l=0;l<Q.length;l++){var ma=dv_GetParam(b,Q[l])||"";la.push(Q[l]+"="+ma);""!==ma&&(window._dv_win.$dv.DebugInfo["dvp_"+
Q[l]]=ma)}for(var na="turl icall dv_callback useragent xff timecheck".split(" "),l=0;l<na.length;l++){var Ga=dv_GetParam(b,na[l]);null!=Ga&&la.push(na[l]+"="+(Ga||""))}var Ya=la.join("&"),s;var Za=function(){try{return!!window.sessionStorage}catch(b){return!0}},$a=function(){try{return!!window.localStorage}catch(b){return!0}},ab=function(){var b=document.createElement("canvas");if(b.getContext&&b.getContext("2d")){var a=b.getContext("2d");a.textBaseline="top";a.font="14px 'Arial'";a.textBaseline=
"alphabetic";a.fillStyle="#f60";a.fillRect(0,0,62,20);a.fillStyle="#069";a.fillText("!image!",2,15);a.fillStyle="rgba(102, 204, 0, 0.7)";a.fillText("!image!",4,17);return b.toDataURL()}return null};try{var m=[];m.push(["lang",navigator.language||navigator.browserLanguage]);m.push(["tz",(new Date).getTimezoneOffset()]);m.push(["hss",Za()?"1":"0"]);m.push(["hls",$a()?"1":"0"]);m.push(["odb",typeof window.openDatabase||""]);m.push(["cpu",navigator.cpuClass||""]);m.push(["pf",navigator.platform||""]);
m.push(["dnt",navigator.doNotTrack||""]);m.push(["canv",ab()]);var i=m.join("=!!!=");if(null==i||""==i)s="";else{for(var G=function(b){for(var a="",d,c=7;0<=c;c--)d=b>>>4*c&15,a+=d.toString(16);return a},bb=[1518500249,1859775393,2400959708,3395469782],i=i+String.fromCharCode(128),t=Math.ceil((i.length/4+2)/16),u=Array(t),h=0;h<t;h++){u[h]=Array(16);for(var v=0;16>v;v++)u[h][v]=i.charCodeAt(64*h+4*v)<<24|i.charCodeAt(64*h+4*v+1)<<16|i.charCodeAt(64*h+4*v+2)<<8|i.charCodeAt(64*h+4*v+3)}u[t-1][14]=
8*(i.length-1)/Math.pow(2,32);u[t-1][14]=Math.floor(u[t-1][14]);u[t-1][15]=8*(i.length-1)&4294967295;for(var R=1732584193,S=4023233417,T=2562383102,U=271733878,V=3285377520,j=Array(80),z,k,n,p,W,h=0;h<t;h++){for(var g=0;16>g;g++)j[g]=u[h][g];for(g=16;80>g;g++)j[g]=(j[g-3]^j[g-8]^j[g-14]^j[g-16])<<1|(j[g-3]^j[g-8]^j[g-14]^j[g-16])>>>31;z=R;k=S;n=T;p=U;W=V;for(g=0;80>g;g++){var Ha=Math.floor(g/20),cb=z<<5|z>>>27,A;c:{switch(Ha){case 0:A=k&n^~k&p;break c;case 1:A=k^n^p;break c;case 2:A=k&n^k&p^n&p;break c;
case 3:A=k^n^p;break c}A=void 0}var db=cb+A+W+bb[Ha]+j[g]&4294967295;W=p;p=n;n=k<<30|k>>>2;k=z;z=db}R=R+z&4294967295;S=S+k&4294967295;T=T+n&4294967295;U=U+p&4294967295;V=V+W&4294967295}s=G(R)+G(S)+G(T)+G(U)+G(V)}}catch(kb){s=null}s=null!=s?"&aadid="+s:"";var Ia=b,b=(window._dv_win.dv_config.visitJSURL||ia+"//"+Xa+"/"+F)+"?"+Ya+"&dvtagver=6.1.src&srcurlD="+f.depth+"&curl="+(null==fa?"":encodeURIComponent(fa))+"&qpgid="+(null==ea?"":ea)+"&ssl="+Aa+"&refD="+dv_referrerDepth+"&htmlmsging="+(ha?"1":"0")+
s+ya,q=window._dv_win.$dv.getMraid();q&&(b+="&ismraid=1");var oa;a:{try{if("object"==typeof window.$ovv||"object"==typeof window.parent.$ovv){oa=!0;break a}}catch(lb){}oa=!1}oa&&(b+="&isovv=1");"http:"==b.match("^http:")&&"https"==window._dv_win.location.toString().match("^https")&&(b+="&dvp_diffSSL=1");var Ja=y&&y.parentElement&&y.parentElement.tagName&&"HEAD"===y.parentElement.tagName;if(!1===ga||Ja)b+="&dvp_isBodyExistOnLoad="+(ga?"1":"0"),b+="&dvp_isOnHead="+(Ja?"1":"0");Ea&&(b+="&"+Ea);Fa&&(b+=
"&"+Fa);var H="srcurl="+encodeURIComponent(E);window._dv_win.$dv.DebugInfo.srcurl=E;var X;var Y=window._dv_win[da("=@42E:@?")][da("2?46DE@C~C:8:?D")];if(Y&&0<Y.length){var pa=[];pa[0]=window._dv_win.location.protocol+"//"+window._dv_win.location.hostname;for(var Z=0;Z<Y.length;Z++)pa[Z+1]=Y[Z];X=pa.reverse().join(",")}else X=null;X&&(H+="&ancChain="+encodeURIComponent(X));var I=dv_GetParam(b,"uid");null==I?(I=dv_GetRnd(),b+="&uid="+I):(I=dv_GetRnd(),b=b.replace(/([?&]uid=)(?:[^&])*/i,"$1"+I));var qa=
4E3;/MSIE (\d+\.\d+);/.test(navigator.userAgent)&&7>=new Number(RegExp.$1)&&(qa=2E3);var Ka=navigator.userAgent.toLowerCase();if(-1<Ka.indexOf("webkit")||-1<Ka.indexOf("chrome")){var La="&referrer="+encodeURIComponent(window._dv_win.location);b.length+La.length<=qa&&(b+=La)}dv_aUrlParam.length+dv_aUrlDepth.length+b.length<=qa&&(b+=dv_aUrlDepth,H+=dv_aUrlParam);b+="&"+this.getVersionParamName()+"="+this.getVersion();b+="&eparams="+encodeURIComponent(da(H));if(void 0!=window._dv_win.$dv.CommonData.BrowserId&&
void 0!=window._dv_win.$dv.CommonData.BrowserVersion&&void 0!=window._dv_win.$dv.CommonData.BrowserIdFromUserAgent)d=window._dv_win.$dv.CommonData.BrowserId,a=window._dv_win.$dv.CommonData.BrowserVersion,c=window._dv_win.$dv.CommonData.BrowserIdFromUserAgent;else{for(var Ma=dv_GetParam(b,"useragent"),Na=Ma?decodeURIComponent(Ma):navigator.userAgent,B=[{id:4,brRegex:"OPR|Opera",verRegex:"(OPR/|Version/)"},{id:1,brRegex:"MSIE|Trident/7.*rv:11|rv:11.*Trident/7|Edge/",verRegex:"(MSIE |rv:| Edge/)"},{id:2,
brRegex:"Firefox",verRegex:"Firefox/"},{id:0,brRegex:"Mozilla.*Android.*AppleWebKit(?!.*Chrome.*)|Linux.*Android.*AppleWebKit.* Version/.*Chrome",verRegex:null},{id:0,brRegex:"AOL/.*AOLBuild/|AOLBuild/.*AOL/|Puffin|Maxthon|Valve|Silk|PLAYSTATION|PlayStation|Nintendo|wOSBrowser",verRegex:null},{id:3,brRegex:"Chrome",verRegex:"Chrome/"},{id:5,brRegex:"Safari|(OS |OS X )[0-9].*AppleWebKit",verRegex:"Version/"}],ra=0,Oa="",w=0;w<B.length;w++)if(null!=Na.match(RegExp(B[w].brRegex))){ra=B[w].id;if(null==
B[w].verRegex)break;var sa=Na.match(RegExp(B[w].verRegex+"[0-9]*"));if(null!=sa)var eb=sa[0].match(RegExp(B[w].verRegex)),Oa=sa[0].replace(eb[0],"");break}var Pa=Ua();d=Pa;a=Pa===ra?Oa:"";c=ra;window._dv_win.$dv.CommonData.BrowserId=d;window._dv_win.$dv.CommonData.BrowserVersion=a;window._dv_win.$dv.CommonData.BrowserIdFromUserAgent=c}b+="&brid="+d+"&brver="+a+"&bridua="+c;window._dv_win.$dv.DebugInfo.dvp_BRID=d;window._dv_win.$dv.DebugInfo.dvp_BRVR=a;window._dv_win.$dv.DebugInfo.dvp_BRIDUA=c;var J;
void 0!=window._dv_win.$dv.CommonData.Scenario?J=window._dv_win.$dv.CommonData.Scenario:(J=this.getTrafficScenarioType(window._dv_win),window._dv_win.$dv.CommonData.Scenario=J);b+="&tstype="+J;window._dv_win.$dv.DebugInfo.dvp_TS=J;var $="";try{window.top==window?$="1":window.top.location.host==window.location.host&&($="2")}catch(mb){$="3"}var aa=window._dv_win.document.visibilityState,Qa=function(){var a=!1;try{a=q&&"function"===typeof q.getState&&"loading"===q.getState()}catch(d){b+="&dvp_mrgsf=1"}return a},
ta=Qa();if("prerender"===aa||ta)b+="&prndr=1",ta&&(b+="&dvp_mrprndr=1");var Ra="dvCallback_"+(window._dv_win.dv_config&&window._dv_win.dv_config.dv_GetRnd?window._dv_win.dv_config.dv_GetRnd():dv_GetRnd()),fb=this.dv_script;window._dv_win[Ra]=function(a,d,c,e){var f=getCurrentTime();d.$uid=c;d=wa(Ia);a.tags.add(c,d);d=wa(b);a.tags[c].set(d);a.tags[c].beginVisitCallbackTS=f;a.tags[c].set({tagElement:fb,dv_protocol:ia,protocol:Va,uid:c});a.tags[c].ImpressionServedTime=getCurrentTime();a.tags[c].getTimeDiff=
function(){return(new Date).getTime()-this.ImpressionServedTime};try{"undefined"!=typeof e&&null!==e&&(a.tags[c].ServerPublicDns=e),a.tags[c].adServingScenario=$,a.tags[c].t2tIframeCreationTime=x,a.tags[c].t2tProcessed=!1,a.tags[c].t2tIframeId=r.id,a.tags[c].t2tIframeWindow=r.contentWindow,$dv.t2tEventDataZombie[r.id]&&(a.tags[c].uniquePageViewId=$dv.t2tEventDataZombie[r.id].uniquePageViewId,$dv.processT2TEvent($dv.t2tEventDataZombie[r.id],a.tags[c]))}catch(g){}if("prerender"===aa)if("prerender"!==
window._dv_win.document.visibilityState&&"unloaded"!==visibilityStateLocal)a.registerEventCall(c,{prndr:0});else{var h;"undefined"!==typeof window._dv_win.document.hidden?h="visibilitychange":"undefined"!==typeof window._dv_win.document.mozHidden?h="mozvisibilitychange":"undefined"!==typeof window._dv_win.document.msHidden?h="msvisibilitychange":"undefined"!==typeof window._dv_win.document.webkitHidden&&(h="webkitvisibilitychange");var i=function(){var b=window._dv_win.document.visibilityState;"prerender"===
aa&&("prerender"!==b&&"unloaded"!==b)&&(aa=b,a.registerEventCall(c,{prndr:0}),window._dv_win.document.removeEventListener(h,i))};window._dv_win.document.addEventListener(h,i,!1)}else if(ta){var j=function(){"function"===typeof q.removeEventListener&&q.removeEventListener("ready",j);a.registerEventCall(c,{prndr:0})};Qa()?"function"===typeof q.addEventListener&&q.addEventListener("ready",j):a.registerEventCall(c,{prndr:0})}};for(var Sa,ba="auctionid vermemid source buymemid anadvid ioid cpgid cpid sellerid pubid advcode iocode cpgcode cpcode pubcode prcpaid auip auua".split(" "),
ua=[],K=0;K<ba.length;K++){var va=dv_GetParam(Ia,ba[K]);null!=va&&(ua.push("dvp_"+ba[K]+"="+va),ua.push(ba[K]+"="+va))}(Sa=ua.join("&"))&&(b+="&"+Sa);return b+"&jsCallback="+Ra};this.sendRequest=function(d){var a;a=this.getVersionParamName();var c=this.getVersion(),e={};e[a]=c;e.dvp_jsErrUrl=d;e.dvp_jsErrMsg=encodeURIComponent("Error loading visit.js");window._dv_win.dv_config=window._dv_win.dv_config||{};window._dv_win.dv_config.tpsErrAddress=window._dv_win.dv_config.tpsAddress||"tps30.doubleverify.com";
a='try{ script.onerror = function(){ try{(new Image()).src = "'+dv_CreateAndGetErrorImp(window._dv_win.dv_config.tpsErrAddress+"/visit.jpg?ctx=818052&cmp=1619415&dvtagver=6.1.src&dvp_isLostImp=1",e)+'";}catch(e){}}}catch(e){}';a='<html><head></head><body><script id="TPSCall" type="text/javascript" src="'+d+'"><\/script><script type="text/javascript">var script = document.getElementById("TPSCall"); if (script && script.readyState) { script.onreadystatechange = function() { if (script.readyState == "complete") document.close(); }; if(script.readyState == "complete") document.close(); } else document.close(); '+
a+"<\/script></body></html>";c=ca("about:blank");this.dv_script.id=c.id.replace("iframe","script");dv_GetParam(d,"uid");L(c);d=dv_getPropSafe(c,"contentDocument")||dv_getPropSafe(dv_getPropSafe(c,"contentWindow"),"document")||dv_getPropSafe(window._dv_win.frames[c.name],"document");window._dv_win.t2tTimestampData.push({beforeVisitCall:getCurrentTime()});if(d){d.open();if(c=c.contentWindow||window._dv_win.frames[c.name])c.$dv=window._dv_win.$dv;d.write(a)}else d=a.replace(/'/g,"\\'"),d='javascript: (function(){document.open(); document.domain="'+
window.document.domain+"\"; window.$dv = window.parent.$dv; document.write('"+encodeURIComponent(d)+"');})()",c=ca(d),this.dv_script.id=c.id.replace("iframe","script"),L(c);return!0};this.isApplicable=function(){return!0};this.onFailure=function(){window._dv_win._dvScriptsInternal.unshift(this.dv_script_obj);var d=window._dv_win.dvProcessed,a=this.dv_script_obj;null!=d&&(void 0!=d&&a)&&(a=d.indexOf(a),-1!=a&&d.splice(a,1));return window._dv_win.$dv.DebugInfo};this.getTrafficScenarioType=function(d){var d=
d||window,a=d._dv_win.$dv.Enums.TrafficScenario;try{if(d.top==d)return a.OnPage;for(var c=0;d.parent!=d&&1E3>c;){if(d.parent.document.domain!=d.document.domain)return a.CrossDomain;d=d.parent;c++}return a.SameDomain}catch(e){}return a.CrossDomain};this.getVersionParamName=function(){return"jsver"};this.getVersion=function(){return"74"}};


function dv_src_main(dv_baseHandlerIns, dv_handlersDefs) {

    this.baseHandlerIns = dv_baseHandlerIns;
    this.handlersDefs = dv_handlersDefs;

    this.exec = function () {
        try {
            window._dv_win = (window._dv_win || window);
            window._dv_win.$dv = (window._dv_win.$dv || new dvType());

            window._dv_win.dv_config = window._dv_win.dv_config || {};
            window._dv_win.dv_config.tpsErrAddress = window._dv_win.dv_config.tpsAddress || 'tps30.doubleverify.com';

            var errorsArr = (new dv_rolloutManager(this.handlersDefs, this.baseHandlerIns)).handle();
            if (errorsArr && errorsArr.length > 0)
                dv_SendErrorImp(window._dv_win.dv_config.tpsErrAddress + '/visit.jpg?ctx=818052&cmp=1619415&dvtagver=6.1.src', errorsArr);
        }
        catch (e) {
            try {
                dv_SendErrorImp(window._dv_win.dv_config.tpsErrAddress + '/visit.jpg?ctx=818052&cmp=1619415&dvtagver=6.1.src&jsver=0&dvp_isLostImp=1', { dvp_jsErrMsg: encodeURIComponent(e) });
            } catch (e) { }
        }
    }
}

try {
    window._dv_win = window._dv_win || window;
    var dv_baseHandlerIns = new dv_baseHandler();
	

    var dv_handlersDefs = [];
    (new dv_src_main(dv_baseHandlerIns, dv_handlersDefs)).exec();
} catch (e) { }

