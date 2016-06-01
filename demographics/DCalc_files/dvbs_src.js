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
                    errorObj = createAndGetError('sendRequest failed.',
                        url,
                        handler.getVersion(),
                        handler.getVersionParamName(),
                        handler.dv_script);
            } else
                errorObj = createAndGetError('createRequest failed.',
                    url,
                    handler.getVersion(),
                    handler.getVersionParamName(),
                    handler.dv_script,
                    handler.dvScripts,
                    handler.dvStep,
                    handler.dvOther
                    );
        }
        catch (e) {
            errorObj = createAndGetError(e.name + ': ' + e.message, url, handler.getVersion(), handler.getVersionParamName(), (handler ? handler.dv_script : null));
        }

        return errorObj;
    }

    function createAndGetError(error, url, ver, versionParamName, dv_script, dvScripts, dvStep, dvOther) {
        var errorObj = {};
        errorObj[versionParamName] = ver;
        errorObj['dvp_jsErrMsg'] = encodeURIComponent(error);
        if (dv_script && dv_script.parentElement && dv_script.parentElement.tagName && dv_script.parentElement.tagName == 'HEAD')
            errorObj['dvp_isOnHead'] = '1';
        if (url)
            errorObj['dvp_jsErrUrl'] = url;
        if (dvScripts) {
            var dvScriptsResult = '';
            for (var id in dvScripts) {
                if (dvScripts[id] && dvScripts[id].src) {
                    dvScriptsResult += encodeURIComponent(dvScripts[id].src) + ":" + dvScripts[id].isContain + ",";
                }
            }
            //errorObj['dvp_dvScripts'] = encodeURIComponent(dvScriptsResult);
           // errorObj['dvp_dvStep'] = dvStep;
           // errorObj['dvp_dvOther'] = dvOther;
        }
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

function dv_Contains(array, obj) {
    var i = array.length;
    while (i--) {
        if (array[i] === obj) {
            return true;
        }
    }
    return false;
}

function dv_GetDynamicParams(url) {
    try {
        var regex = new RegExp("[\\?&](dvp_[^&]*=[^&#]*)", "gi");
        var dvParams = regex.exec(url);

        var results = new Array();
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
    for (key in errorObj) {
        if (errorObj.hasOwnProperty(key)) {
            if (key.indexOf('dvp_jsErrUrl') == -1) {
                errorQueryString += '&' + key + '=' + errorObj[key];
            }
            else {
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

function dv_sendScriptRequest(url) {
    document.write('<scr' + 'ipt type="text/javascript" src="' + url + '"></scr' + 'ipt>');
}

function dv_getPropSafe(obj, propName) {
    try {
        if (obj)
            return obj[propName];
    } catch (e) { }
}

function dvBsType() {
    var that = this;
    var eventsForDispatch = {};
    this.t2tEventDataZombie = {};

    this.processT2TEvent = function (data, tag) {
        try {
            if (tag.ServerPublicDns) {
                data.timeStampCollection.push({"beginProcessT2TEvent" : getCurrentTime()});
                data.timeStampCollection.push({'beginVisitCallback' : tag.beginVisitCallbackTS});
                var tpsServerUrl = tag.dv_protocol + '//' + tag.ServerPublicDns + '/event.gif?impid=' + tag.uid;

                if (!tag.uniquePageViewId) {
                    tag.uniquePageViewId = data.uniquePageViewId;
                }

                tpsServerUrl += '&dvp_upvid=' + tag.uniquePageViewId;
                tpsServerUrl += '&dvp_numFrames=' + data.totalIframeCount;
                tpsServerUrl += '&dvp_numt2t=' + data.totalT2TiframeCount;
                tpsServerUrl += '&dvp_frameScanDuration=' + data.scanAllFramesDuration;
                tpsServerUrl += '&dvp_scene=' + tag.adServingScenario;
                tpsServerUrl += '&dvp_ist2twin=' + (data.isWinner ? '1' : '0');
                tpsServerUrl += '&dvp_numTags=' + Object.keys($dvbs.tags).length;
                tpsServerUrl += '&dvp_isInSample=' + data.isInSample;
                tpsServerUrl += (data.wasZombie)?'&dvp_wasZombie=1':'&dvp_wasZombie=0';
                tpsServerUrl += '&dvp_ts_t2tCreatedOn=' + data.creationTime;
                if(data.timeStampCollection)
                {
                    if(window._dv_win.t2tTimestampData)
                    {
                        for(var tsI = 0; tsI < window._dv_win.t2tTimestampData.length; tsI++)
                        {
                            data.timeStampCollection.push(window._dv_win.t2tTimestampData[tsI]);
                        }
                    }

                    for(var i = 0; i< data.timeStampCollection.length;i++)
                    {
                        var item = data.timeStampCollection[i];
                        for(var propName in item)
                        {
                            if(item.hasOwnProperty(propName))
                            {
                                tpsServerUrl += '&dvp_ts_' + propName + '=' + item[propName];
                            }
                        }
                    }
                }
                $dvbs.domUtilities.addImage(tpsServerUrl, tag.tagElement.parentElement);
            }
        } catch (e) {
            try {
                dv_SendErrorImp(window._dv_win.dv_config.tpsErrAddress + '/visit.jpg?ctx=818052&cmp=1619415&dvtagver=6.1.src&jsver=0&dvp_ist2tProcess=1', { dvp_jsErrMsg: encodeURIComponent(e) });
            } catch (ex) { }
        }
    };

    this.processTagToTagCollision = function (collision, tag) {
        var i;
        var tpsServerUrl = tag.dv_protocol + '//' + tag.ServerPublicDns + '/event.gif?impid=' + tag.uid;
        var additions = [
            '&dvp_collisionReasons=' + collision.reasonBitFlag,
            '&dvp_ts_reporterDvTagCreated=' + collision.thisTag.dvTagCreatedTS,
            '&dvp_ts_reporterVisitJSMessagePosted=' + collision.thisTag.visitJSPostMessageTS,
            '&dvp_ts_reporterReceivedByT2T=' + collision.thisTag.receivedByT2TTS,
            '&dvp_ts_collisionPostedFromT2T=' + collision.postedFromT2TTS,
            '&dvp_ts_collisionReceivedByCommon=' + collision.commonRecievedTS,
            '&dvp_collisionTypeId=' + collision.allReasonsForTagBitFlag
        ];
        tpsServerUrl += additions.join("");

        for (i = 0; i < collision.reasons.length; i++){
            var reason = collision.reasons[i];
            tpsServerUrl += '&dvp_' + reason + "MS=" + collision[reason+"MS"];
        }

        if(tag.uniquePageViewId){
            tpsServerUrl +=  '&dvp_upvid='+tag.uniquePageViewId;
        }
        $dvbs.domUtilities.addImage(tpsServerUrl, tag.tagElement.parentElement);
    };

    var messageEventListener = function (event) {
        try {
            var timeCalled = getCurrentTime();
            var data = window.JSON.parse(event.data);
            if(!data.action){
                data = window.JSON.parse(data);
            }
            if(data.timeStampCollection)
            {
                data.timeStampCollection.push({messageEventListenerCalled:timeCalled});
            }
            var myUID;
            var visitJSHasBeenCalledForThisTag = false;
            if ($dvbs.tags) {
                for (var uid in $dvbs.tags) {
                    if ($dvbs.tags.hasOwnProperty(uid) && $dvbs.tags[uid] && $dvbs.tags[uid].t2tIframeId === data.iFrameId) {
                        myUID = uid;
                        visitJSHasBeenCalledForThisTag = true;
                        break;
                    }
                }
            }

            switch(data.action){
            case 'uniquePageViewIdDetermination' :
                if(visitJSHasBeenCalledForThisTag){
                    $dvbs.processT2TEvent(data, $dvbs.tags[myUID]);
                    $dvbs.t2tEventDataZombie[data.iFrameId] = undefined;
                }
                else
                {
                    data.wasZombie = 1;
                    $dvbs.t2tEventDataZombie[data.iFrameId] = data;
                }
            break;
            case 'maColl':
                var tag = $dvbs.tags[myUID];
                //mark we got a message, so we'll stop sending them in the future
                tag.AdCollisionMessageRecieved = true;
                if (!tag.uniquePageViewId) { tag.uniquePageViewId = data.uniquePageViewId; }
                data.collision.commonRecievedTS = timeCalled;
                $dvbs.processTagToTagCollision(data.collision, tag);
            break;
            }

        } catch (e) {
            try{
                dv_SendErrorImp(window._dv_win.dv_config.tpsErrAddress + '/visit.jpg?ctx=818052&cmp=1619415&dvtagver=6.1.src&jsver=0&dvp_ist2tListener=1', { dvp_jsErrMsg: encodeURIComponent(e) });
            } catch (ex) { }
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
            subscribers[eventName + uid].push({ Func: func, ActionName: actionName });
        }

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
        }
    };

    this.domUtilities = new function () {

        this.addImage = function (url, parentElement) {
            var image = parentElement.ownerDocument.createElement("img");
            image.width = 0;
            image.height = 0;
            image.style.display = 'none';
            image.src = appendCacheBuster(url);
            parentElement.insertBefore(image, parentElement.firstChild);
        };

        this.addScriptResource = function (url, parentElement) {
            var scriptElem = parentElement.ownerDocument.createElement("script");
            scriptElem.type = 'text/javascript';
            scriptElem.src = appendCacheBuster(url);
            parentElement.insertBefore(scriptElem, parentElement.firstChild);
        };

        this.addScriptCode = function (srcCode, parentElement) {
            var scriptElem = parentElement.ownerDocument.createElement("script");
            scriptElem.type = 'text/javascript';
            scriptElem.innerHTML = srcCode;
            parentElement.insertBefore(scriptElem, parentElement.firstChild);
        };

        this.addHtml = function (srcHtml, parentElement) {
            var divElem = parentElement.ownerDocument.createElement("div");
            divElem.style = "display: inline";
            divElem.innerHTML = srcHtml;
            parentElement.insertBefore(divElem, parentElement.firstChild);
        }
    };

    this.resolveMacros = function(str, tag) {
        var viewabilityData = tag.getViewabilityData();
        var viewabilityBuckets = viewabilityData && viewabilityData.buckets ? viewabilityData.buckets : { };
        var upperCaseObj = objectsToUpperCase(tag, viewabilityData, viewabilityBuckets);
        var newStr = str.replace('[DV_PROTOCOL]', upperCaseObj.DV_PROTOCOL);
        newStr = newStr.replace('[PROTOCOL]', upperCaseObj.PROTOCOL);
        newStr = newStr.replace( /\[(.*?)\]/g , function(match, p1) {
            var value = upperCaseObj[p1];
            if (value === undefined || value === null)
                value = '[' + p1 + ']';
            return encodeURIComponent(value);
        });
        return newStr;
    };

    this.settings = new function () {
    };

    this.tagsType = function () { };

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

    this.tag = function () { }
    this.tagPrototype = function () {
        this.set = function (obj) {
            for (var key in obj)
                this[key] = obj[key];
        }

        this.getViewabilityData = function () {
        }
    };

    this.tag.prototype = new this.tagPrototype();
    this.tag.prototype.constructor = this.tag;

    this.getTagObjectByService = function (serviceName) {

        for (var impressionId in this.tags) {
            if (typeof this.tags[impressionId] === 'object'
                && this.tags[impressionId].services
                && this.tags[impressionId].services[serviceName]
                && !this.tags[impressionId].services[serviceName].isProcessed) {
                this.tags[impressionId].services[serviceName].isProcessed = true;
                return this.tags[impressionId];
            }
        }


        return null;
    };

    this.addService = function (impressionId, serviceName, paramsObject) {

        if (!impressionId || !serviceName)
            return;

        if (!this.tags[impressionId])
            return;
        else {
            if (!this.tags[impressionId].services)
                this.tags[impressionId].services = {};

            this.tags[impressionId].services[serviceName] = {
                params: paramsObject,
                isProcessed: false
            };
        }
    };

    this.Enums = {
        BrowserId: { Others: 0, IE: 1, Firefox: 2, Chrome: 3, Opera: 4, Safari: 5 },
        TrafficScenario: { OnPage: 1, SameDomain: 2, CrossDomain: 128 }
    };

    this.CommonData = { };
    
    var runSafely = function (action) {
        try {
            var ret = action();
            return ret !== undefined ? ret : true;
        } catch (e) { return false; }
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

    this.dispatchRegisteredEventsFromAllTags = function () {
        for (var impressionId in this.tags) {
            if (typeof this.tags[impressionId] !== 'function' && typeof this.tags[impressionId] !== 'undefined')
                dispatchEventCalls(impressionId, this);
        }
    };

    var dispatchEventCalls = function (impressionId, dvObj) {
        var tag = dvObj.tags[impressionId];
        var eventObj = eventsForDispatch[impressionId];
        if (typeof eventObj !== 'undefined' && eventObj != null) {
            var url = tag.protocol + '//' + tag.ServerPublicDns + "/bsevent.gif?impid=" + impressionId + '&' + createQueryStringParams(eventObj);
            dvObj.domUtilities.addImage(url, tag.tagElement.parentElement);
            eventsForDispatch[impressionId] = null;
        }
    };

    this.registerEventCall = function (impressionId, eventObject, timeoutMs) {        
        addEventCallForDispatch(impressionId, eventObject);

        if (typeof timeoutMs === 'undefined' || timeoutMs == 0 || isNaN(timeoutMs))
            dispatchEventCallsNow(this, impressionId, eventObject);
        else {
            if (timeoutMs > 2000)
                timeoutMs = 2000;

            var dvObj = this;
            setTimeout(function () {
                dispatchEventCalls(impressionId, dvObj);
                }, timeoutMs);
        }        
    };

    var dispatchEventCallsNow = function (dvObj, impressionId, eventObject) {
        addEventCallForDispatch(impressionId, eventObject);
        dispatchEventCalls(impressionId, dvObj);
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

    if (window.addEventListener) {
        window.addEventListener('unload', function () { that.dispatchRegisteredEventsFromAllTags(); }, false);
        window.addEventListener('beforeunload', function () { that.dispatchRegisteredEventsFromAllTags(); }, false);
    }
    else if (window.attachEvent) {
        window.attachEvent('onunload', function () { that.dispatchRegisteredEventsFromAllTags(); }, false);
        window.attachEvent('onbeforeunload', function () { that.dispatchRegisteredEventsFromAllTags(); }, false);
    }
    else {
        window.document.body.onunload = function () { that.dispatchRegisteredEventsFromAllTags(); };
        window.document.body.onbeforeunload = function () { that.dispatchRegisteredEventsFromAllTags(); };
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
}


function dv_baseHandler(){function J(e){if(window._dv_win.document.body)return window._dv_win.document.body.insertBefore(e,window._dv_win.document.body.firstChild),!0;var a=0,g=function(){if(window._dv_win.document.body)try{window._dv_win.document.body.insertBefore(e,window._dv_win.document.body.firstChild)}catch(c){}else a++,150>a&&setTimeout(g,20)};setTimeout(g,20);return!1}function L(e){var a,g=window._dv_win.document.visibilityState;window[e.tagObjectCallbackName]=function(c){if(window._dv_win.$dvbs){var b=
"https"==window._dv_win.location.toString().match("^https")?"https:":"http:";a=c.ImpressionID;window._dv_win.$dvbs.tags.add(c.ImpressionID,e);window._dv_win.$dvbs.tags[c.ImpressionID].set({tagElement:e.script,impressionId:c.ImpressionID,dv_protocol:e.protocol,protocol:b,uid:e.uid,serverPublicDns:c.ServerPublicDns,ServerPublicDns:c.ServerPublicDns});if("prerender"===g)if("prerender"!==window._dv_win.document.visibilityState&&"unloaded"!==visibilityStateLocal)window._dv_win.$dvbs.registerEventCall(c.ImpressionID,
{prndr:0});else{var d;"undefined"!==typeof window._dv_win.document.hidden?d="visibilitychange":"undefined"!==typeof window._dv_win.document.mozHidden?d="mozvisibilitychange":"undefined"!==typeof window._dv_win.document.msHidden?d="msvisibilitychange":"undefined"!==typeof window._dv_win.document.webkitHidden&&(d="webkitvisibilitychange");var p=function(){var a=window._dv_win.document.visibilityState;"prerender"===g&&("prerender"!==a&&"unloaded"!==a)&&(g=a,window._dv_win.$dvbs.registerEventCall(c.ImpressionID,
{prndr:0}),window._dv_win.document.removeEventListener(d,p))};window._dv_win.document.addEventListener(d,p,!1)}}};window[e.callbackName]=function(c){var b;b=window._dv_win.$dvbs&&"object"==typeof window._dv_win.$dvbs.tags[a]?window._dv_win.$dvbs.tags[a]:e;e.perf&&e.perf.addTime("r7");var d=window._dv_win.dv_config.bs_renderingMethod||function(a){document.write(a)};switch(c.ResultID){case 1:b.tagPassback?d(b.tagPassback):c.Passback?d(decodeURIComponent(c.Passback)):c.AdWidth&&c.AdHeight&&d(decodeURIComponent("%3Cstyle%3E%0A.dvbs_container%20%7B%0A%09border%3A%201px%20solid%20%233b599e%3B%0A%09overflow%3A%20hidden%3B%0A%09filter%3A%20progid%3ADXImageTransform.Microsoft.gradient(startColorstr%3D%27%23315d8c%27%2C%20endColorstr%3D%27%2384aace%27)%3B%0A%09%2F*%20for%20IE%20*%2F%0A%09background%3A%20-webkit-gradient(linear%2C%20left%20top%2C%20left%20bottom%2C%20from(%23315d8c)%2C%20to(%2384aace))%3B%0A%09%2F*%20for%20webkit%20browsers%20*%2F%0A%09background%3A%20-moz-linear-gradient(top%2C%20%23315d8c%2C%20%2384aace)%3B%0A%09%2F*%20for%20firefox%203.6%2B%20*%2F%0A%7D%0A.dvbs_cloud%20%7B%0A%09color%3A%20%23fff%3B%0A%09position%3A%20relative%3B%0A%09font%3A%20100%25%22Times%20New%20Roman%22%2C%20Times%2C%20serif%3B%0A%09text-shadow%3A%200px%200px%2010px%20%23fff%3B%0A%09line-height%3A%200%3B%0A%7D%0A%3C%2Fstyle%3E%0A%3Cscript%20type%3D%22text%2Fjavascript%22%3E%0A%09function%0A%20%20%20%20cloud()%7B%0A%09%09var%20b1%20%3D%20%22%3Cdiv%20class%3D%5C%22dvbs_cloud%5C%22%20style%3D%5C%22font-size%3A%22%3B%0A%09%09var%20b2%3D%22px%3B%20position%3A%20absolute%3B%20top%3A%20%22%3B%0A%09%09document.write(b1%20%2B%20%22300px%3B%20width%3A%20300px%3B%20height%3A%20300%22%20%2B%20b2%20%2B%20%2234px%3B%20left%3A%2028px%3B%5C%22%3E.%3C%5C%2Fdiv%3E%22)%3B%0A%09%09document.write(b1%20%2B%20%22300px%3B%20width%3A%20300px%3B%20height%3A%20300%22%20%2B%20b2%20%2B%20%2246px%3B%20left%3A%2010px%3B%5C%22%3E.%3C%5C%2Fdiv%3E%22)%3B%0A%09%09document.write(b1%20%2B%20%22300px%3B%20width%3A%20300px%3B%20height%3A%20300%22%20%2B%20b2%20%2B%20%2246px%3B%20left%3A50px%3B%5C%22%3E.%3C%5C%2Fdiv%3E%22)%3B%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%0A%09%09document.write(b1%20%2B%20%22400px%3B%20width%3A%20400px%3B%20height%3A%20400%22%20%2B%20b2%20%2B%20%2224px%3B%20left%3A20px%3B%5C%22%3E.%3C%5C%2Fdiv%3E%22)%3B%0A%20%20%20%20%7D%0A%20%20%20%20%0A%09function%20clouds()%7B%0A%20%20%20%20%20%20%20%20var%20top%20%3D%20%5B%27-80%27%2C%2780%27%2C%27240%27%2C%27400%27%5D%3B%0A%09%09var%20left%20%3D%20-10%3B%0A%20%20%20%20%20%20%20%20var%20a1%20%3D%20%22%3Cdiv%20style%3D%5C%22position%3A%20relative%3B%20top%3A%20%22%3B%0A%09%09var%20a2%20%3D%20%22px%3B%20left%3A%20%22%3B%0A%20%20%20%20%20%20%20%20var%20a3%3D%20%22px%3B%5C%22%3E%3Cscr%22%2B%22ipt%20type%3D%5C%22text%5C%2Fjavascr%22%2B%22ipt%5C%22%3Ecloud()%3B%3C%5C%2Fscr%22%2B%22ipt%3E%3C%5C%2Fdiv%3E%22%3B%0A%20%20%20%20%20%20%20%20for(i%3D0%3B%20i%20%3C%208%3B%20i%2B%2B)%20%7B%0A%09%09%09document.write(a1%2Btop%5B0%5D%2Ba2%2Bleft%2Ba3)%3B%0A%09%09%09document.write(a1%2Btop%5B1%5D%2Ba2%2Bleft%2Ba3)%3B%0A%09%09%09document.write(a1%2Btop%5B2%5D%2Ba2%2Bleft%2Ba3)%3B%0A%09%09%09document.write(a1%2Btop%5B3%5D%2Ba2%2Bleft%2Ba3)%3B%0A%09%09%09if(i%3D%3D4)%0A%09%09%09%7B%0A%09%09%09%09left%20%3D-%2090%3B%0A%09%09%09%09top%20%3D%20%5B%270%27%2C%27160%27%2C%27320%27%2C%27480%27%5D%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20else%20%0A%09%09%09%09left%20%2B%3D%20160%3B%0A%09%09%7D%0A%09%7D%0A%0A%3C%2Fscript%3E%0A%3Cdiv%20class%3D%22dvbs_container%22%20style%3D%22width%3A%20"+
c.AdWidth+"px%3B%20height%3A%20"+c.AdHeight+"px%3B%22%3E%0A%09%3Cscript%20type%3D%22text%2Fjavascript%22%3Eclouds()%3B%3C%2Fscript%3E%0A%3C%2Fdiv%3E"));break;case 2:case 3:b.tagAdtag&&d(b.tagAdtag);break;case 4:c.AdWidth&&c.AdHeight&&d(decodeURIComponent("%3Cstyle%3E%0A.dvbs_container%20%7B%0A%09border%3A%201px%20solid%20%233b599e%3B%0A%09overflow%3A%20hidden%3B%0A%09filter%3A%20progid%3ADXImageTransform.Microsoft.gradient(startColorstr%3D%27%23315d8c%27%2C%20endColorstr%3D%27%2384aace%27)%3B%0A%7D%0A%3C%2Fstyle%3E%0A%3Cdiv%20class%3D%22dvbs_container%22%20style%3D%22width%3A%20"+
c.AdWidth+"%3B%20height%3A%20"+c.AdHeight+"%3B%22%3E%09%0A%3C%2Fdiv%3E"))}}}function M(e){var a=null,g=null,c;var b=e.src,d=dv_GetParam(b,"cmp"),b=dv_GetParam(b,"ctx");c="919838"==b&&"7951767"==d||"919839"==b&&"7939985"==d||"971108"==b&&"7900229"==d||"971108"==b&&"7951940"==d?"</scr'+'ipt>":/<\/scr\+ipt>/g;"function"!==typeof String.prototype.trim&&(String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g,"")});var p=function(b){if((b=b.previousSibling)&&"#text"==b.nodeName&&(null==b.nodeValue||
void 0==b.nodeValue||0==b.nodeValue.trim().length))b=b.previousSibling;if(b&&"SCRIPT"==b.tagName&&b.getAttribute("type")&&("text/adtag"==b.getAttribute("type").toLowerCase()||"text/passback"==b.getAttribute("type").toLowerCase())&&""!=b.innerHTML.trim()){if("text/adtag"==b.getAttribute("type").toLowerCase())return a=b.innerHTML.replace(c,"<\/script>"),{isBadImp:!1,hasPassback:!1,tagAdTag:a,tagPassback:g};if(null!=g)return{isBadImp:!0,hasPassback:!1,tagAdTag:a,tagPassback:g};g=b.innerHTML.replace(c,
"<\/script>");b=p(b);b.hasPassback=!0;return b}return{isBadImp:!0,hasPassback:!1,tagAdTag:a,tagPassback:g}};return p(e)}function E(e,a,g,c,b,d,p,k,s){var h,m,i;void 0==a.dvregion&&(a.dvregion=0);var t,r,F;try{i=c;for(m=0;10>m&&i!=window._dv_win.top;)m++,i=i.parent;c.depth=m;h=N(c);t="&aUrl="+encodeURIComponent(h.url);r="&aUrlD="+h.depth;F=c.depth+b;d&&c.depth--}catch(j){r=t=F=c.depth=""}void 0!=a.aUrl&&(t="&aUrl="+a.aUrl);b=a.script.src;d="&ctx="+(dv_GetParam(b,"ctx")||"")+"&cmp="+(dv_GetParam(b,
"cmp")||"")+"&plc="+(dv_GetParam(b,"plc")||"")+"&sid="+(dv_GetParam(b,"sid")||"")+"&advid="+(dv_GetParam(b,"advid")||"")+"&adsrv="+(dv_GetParam(b,"adsrv")||"")+"&unit="+(dv_GetParam(b,"unit")||"")+"&uid="+a.uid+"&tagtype="+(dv_GetParam(b,"tagtype")||"")+"&adID="+(dv_GetParam(b,"adID")||"");(i=dv_GetParam(b,"xff"))&&(d+="&xff="+i);(i=dv_GetParam(b,"useragent"))&&(d+="&useragent="+i);if(void 0!=window._dv_win.$dvbs.CommonData.BrowserId&&void 0!=window._dv_win.$dvbs.CommonData.BrowserVersion&&void 0!=
window._dv_win.$dvbs.CommonData.BrowserIdFromUserAgent)h=window._dv_win.$dvbs.CommonData.BrowserId,m=window._dv_win.$dvbs.CommonData.BrowserVersion,i=window._dv_win.$dvbs.CommonData.BrowserIdFromUserAgent;else{var n=i?decodeURIComponent(i):navigator.userAgent;h=[{id:4,brRegex:"OPR|Opera",verRegex:"(OPR/|Version/)"},{id:1,brRegex:"MSIE|Trident/7.*rv:11|rv:11.*Trident/7|Edge/",verRegex:"(MSIE |rv:| Edge/)"},{id:2,brRegex:"Firefox",verRegex:"Firefox/"},{id:0,brRegex:"Mozilla.*Android.*AppleWebKit(?!.*Chrome.*)|Linux.*Android.*AppleWebKit.* Version/.*Chrome",
verRegex:null},{id:0,brRegex:"AOL/.*AOLBuild/|AOLBuild/.*AOL/|Puffin|Maxthon|Valve|Silk|PLAYSTATION|PlayStation|Nintendo|wOSBrowser",verRegex:null},{id:3,brRegex:"Chrome",verRegex:"Chrome/"},{id:5,brRegex:"Safari|(OS |OS X )[0-9].*AppleWebKit",verRegex:"Version/"}];i=0;m="";for(var f=0;f<h.length;f++)if(null!=n.match(RegExp(h[f].brRegex))){i=h[f].id;if(null==h[f].verRegex)break;n=n.match(RegExp(h[f].verRegex+"[0-9]*"));null!=n&&(m=n[0].match(RegExp(h[f].verRegex)),m=n[0].replace(m[0],""));break}h=
f=O();m=f===i?m:"";window._dv_win.$dvbs.CommonData.BrowserId=h;window._dv_win.$dvbs.CommonData.BrowserVersion=m;window._dv_win.$dvbs.CommonData.BrowserIdFromUserAgent=i}d+="&brid="+h+"&brver="+m+"&bridua="+i;(i=dv_GetParam(b,"turl"))&&(d+="&turl="+i);(i=dv_GetParam(b,"tagformat"))&&(d+="&tagformat="+i);var A;i=function(){try{return!!window.sessionStorage}catch(a){return!0}};m=function(){try{return!!window.localStorage}catch(a){return!0}};h=function(){var a=document.createElement("canvas");if(a.getContext&&
a.getContext("2d")){var b=a.getContext("2d");b.textBaseline="top";b.font="14px 'Arial'";b.textBaseline="alphabetic";b.fillStyle="#f60";b.fillRect(0,0,62,20);b.fillStyle="#069";b.fillText("!image!",2,15);b.fillStyle="rgba(102, 204, 0, 0.7)";b.fillText("!image!",4,17);return a.toDataURL()}return null};try{f=[];f.push(["lang",navigator.language||navigator.browserLanguage]);f.push(["tz",(new Date).getTimezoneOffset()]);f.push(["hss",i()?"1":"0"]);f.push(["hls",m()?"1":"0"]);f.push(["odb",typeof window.openDatabase||
""]);f.push(["cpu",navigator.cpuClass||""]);f.push(["pf",navigator.platform||""]);f.push(["dnt",navigator.doNotTrack||""]);f.push(["canv",h()]);var q=f.join("=!!!=");if(null==q||""==q)A="";else{i=function(a){for(var b="",c,d=7;0<=d;d--)c=a>>>4*d&15,b+=c.toString(16);return b};m=[1518500249,1859775393,2400959708,3395469782];var q=q+String.fromCharCode(128),y=Math.ceil((q.length/4+2)/16),z=Array(y);for(h=0;h<y;h++){z[h]=Array(16);for(f=0;16>f;f++)z[h][f]=q.charCodeAt(64*h+4*f)<<24|q.charCodeAt(64*h+
4*f+1)<<16|q.charCodeAt(64*h+4*f+2)<<8|q.charCodeAt(64*h+4*f+3)}z[y-1][14]=8*(q.length-1)/Math.pow(2,32);z[y-1][14]=Math.floor(z[y-1][14]);z[y-1][15]=8*(q.length-1)&4294967295;var q=1732584193,f=4023233417,n=2562383102,G=271733878,H=3285377520,u=Array(80),B,v,w,x,I;for(h=0;h<y;h++){for(var l=0;16>l;l++)u[l]=z[h][l];for(l=16;80>l;l++)u[l]=(u[l-3]^u[l-8]^u[l-14]^u[l-16])<<1|(u[l-3]^u[l-8]^u[l-14]^u[l-16])>>>31;B=q;v=f;w=n;x=G;I=H;for(l=0;80>l;l++){var D=Math.floor(l/20),E=B<<5|B>>>27,C;c:{switch(D){case 0:C=
v&w^~v&x;break c;case 1:C=v^w^x;break c;case 2:C=v&w^v&x^w&x;break c;case 3:C=v^w^x;break c}C=void 0}var J=E+C+I+m[D]+u[l]&4294967295;I=x;x=w;w=v<<30|v>>>2;v=B;B=J}q=q+B&4294967295;f=f+v&4294967295;n=n+w&4294967295;G=G+x&4294967295;H=H+I&4294967295}A=i(q)+i(f)+i(n)+i(G)+i(H)}}catch(L){A=null}a=(window._dv_win.dv_config.verifyJSURL||a.protocol+"//"+(window._dv_win.dv_config.bsAddress||"rtb"+a.dvregion+".doubleverify.com")+"/verify.js")+"?jsCallback="+a.callbackName+"&jsTagObjCallback="+a.tagObjectCallbackName+
"&num=6"+d+"&srcurlD="+c.depth+"&ssl="+a.ssl+"&refD="+F+a.tagIntegrityFlag+a.tagHasPassbackFlag+"&htmlmsging="+(p?"1":"0")+(null!=A?"&aadid="+A:"");(c=dv_GetDynamicParams(b).join("&"))&&(a+="&"+c);if(!1===k||s)a=a+("&dvp_isBodyExistOnLoad="+(k?"1":"0"))+("&dvp_isOnHead="+(s?"1":"0"));g="srcurl="+encodeURIComponent(g);if((k=window._dv_win[K("=@42E:@?")][K("2?46DE@C~C:8:?D")])&&0<k.length){s=[];s[0]=window._dv_win.location.protocol+"//"+window._dv_win.location.hostname;for(c=0;c<k.length;c++)s[c+1]=
k[c];k=s.reverse().join(",")}else k=null;k&&(g+="&ancChain="+encodeURIComponent(k));k=4E3;/MSIE (\d+\.\d+);/.test(navigator.userAgent)&&7>=new Number(RegExp.$1)&&(k=2E3);if(b=dv_GetParam(b,"referrer"))b="&referrer="+b,a.length+b.length<=k&&(a+=b);t.length+r.length+a.length<=k&&(a+=r,g+=t);"prerender"===window._dv_win.document.visibilityState&&(a+="&prndr=1");return a+="&eparams="+encodeURIComponent(K(g))+"&"+e.getVersionParamName()+"="+e.getVersion()}function N(e){try{if(1>=e.depth)return{url:"",
depth:""};var a,g=[];g.push({win:window._dv_win.top,depth:0});for(var c,b=1,d=0;0<b&&100>d;){try{if(d++,c=g.shift(),b--,0<c.win.location.toString().length&&c.win!=e)return 0==c.win.document.referrer.length||0==c.depth?{url:c.win.location,depth:c.depth}:{url:c.win.document.referrer,depth:c.depth-1}}catch(p){}a=c.win.frames.length;for(var k=0;k<a;k++)g.push({win:c.win.frames[k],depth:c.depth+1}),b++}return{url:"",depth:""}}catch(s){return{url:"",depth:""}}}function K(e){new String;var a=new String,
g,c,b;for(g=0;g<e.length;g++)b=e.charAt(g),c="!\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~".indexOf(b),0<=c&&(b="!\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~".charAt((c+47)%94)),a+=b;return a}function D(){return Math.floor(1E12*(Math.random()+""))}function O(){try{if("function"===typeof window.callPhantom)return 99;try{if("function"===typeof window.top.callPhantom)return 99}catch(e){}if(void 0!=
window.opera&&void 0!=window.history.navigationMode||void 0!=window.opr&&void 0!=window.opr.addons&&"function"==typeof window.opr.addons.installExtension)return 4;if(void 0!=window.chrome&&"function"==typeof window.chrome.csi&&"function"==typeof window.chrome.loadTimes&&void 0!=document.webkitHidden&&(!0==document.webkitHidden||!1==document.webkitHidden))return 3;if(void 0!=window.mozInnerScreenY&&"number"==typeof window.mozInnerScreenY&&void 0!=window.mozPaintCount&&0<=window.mozPaintCount&&void 0!=
window.InstallTrigger&&void 0!=window.InstallTrigger.install)return 2;if(void 0!=document.uniqueID&&"string"==typeof document.uniqueID&&(void 0!=document.documentMode&&0<=document.documentMode||void 0!=document.all&&"object"==typeof document.all||void 0!=window.ActiveXObject&&"function"==typeof window.ActiveXObject)||window.document&&window.document.updateSettings&&"function"==typeof window.document.updateSettings)return 1;var a=!1;try{var g=document.createElement("p");g.innerText=".";g.style="text-shadow: rgb(99, 116, 171) 20px -12px 2px";
a=void 0!=g.style.textShadow}catch(c){}return 0<Object.prototype.toString.call(window.HTMLElement).indexOf("Constructor")&&a&&void 0!=window.innerWidth&&void 0!=window.innerHeight?5:0}catch(b){return 0}}this.createRequest=function(){this.perf&&this.perf.addTime("r3");var e=!1,a=window._dv_win,g=0,c=!1;try{for(dv_i=0;10>=dv_i;dv_i++)if(null!=a.parent&&a.parent!=a)if(0<a.parent.location.toString().length)a=a.parent,g++,e=!0;else{e=!1;break}else{0==dv_i&&(e=!0);break}}catch(b){e=!1}0==a.document.referrer.length?
e=a.location:e?e=a.location:(e=a.document.referrer,c=!0);window._dv_win._dvScripts||(window._dv_win._dvScripts=[]);var d=document.getElementsByTagName("script");this.dvScripts=[];this.dvOther=this.dvStep=0;for(dv_i in d)if(d[dv_i].src){var p=d[dv_i].src,k=window._dv_win.dv_config.bs_regex||/\.doubleverify\.com:?[0-9]*\/dvbs_src\.js/;if(p&&p.match(k)&&!dv_Contains(window._dv_win._dvScripts,d[dv_i])){this.dvStep=1;this.dv_script=d[dv_i];window._dv_win._dvScripts.push(d[dv_i]);var s;s=window._dv_win.dv_config?
window._dv_win.dv_config.bst2tid?window._dv_win.dv_config.bst2tid:window._dv_win.dv_config.dv_GetRnd?window._dv_win.dv_config.dv_GetRnd():D():D();var h,k=window.parent.postMessage&&window.JSON,m=!0,i=!1;if("0"==dv_GetParam(p,"t2te")||window._dv_win.dv_config&&!0==window._dv_win.dv_config.supressT2T)i=!0;if(k&&!1==i)try{var t=window._dv_win.dv_config.bst2turl||"https://cdn3.doubleverify.com/bst2tv3.html",i="bst2t_"+s,r=void 0;if(document.createElement&&(r=document.createElement("iframe")))r.name=r.id=
window._dv_win.dv_config.emptyIframeID||"iframe_"+D(),r.width=0,r.height=0,r.id=i,r.style.display="none",r.src=t;h=r;m=J(h)}catch(F){}var j;h=p;t={};try{for(var n=RegExp("[\\?&]([^&]*)=([^&#]*)","gi"),f=n.exec(h);null!=f;)"eparams"!==f[1]&&(t[f[1]]=f[2]),f=n.exec(h);j=t}catch(A){j=t}j.perf=this.perf;j.uid=s;j.script=this.dv_script;j.callbackName="__verify_callback_"+j.uid;j.tagObjectCallbackName="__tagObject_callback_"+j.uid;j.tagAdtag=null;j.tagPassback=null;j.tagIntegrityFlag="";j.tagHasPassbackFlag=
"";!1==(null!=j.tagformat&&"2"==j.tagformat)&&(n=M(j.script),j.tagAdtag=n.tagAdTag,j.tagPassback=n.tagPassback,n.isBadImp?j.tagIntegrityFlag="&isbadimp=1":n.hasPassback&&(j.tagHasPassbackFlag="&tagpb=1"));j.protocol="http:";j.ssl="0";"https"==j.script.src.match("^https")&&"https"==window._dv_win.location.toString().match("^https")&&(j.protocol="https:",j.ssl="1");this.dvStep=2;L(j);this.perf&&this.perf.addTime("r4");d=d[dv_i]&&d[dv_i].parentElement&&d[dv_i].parentElement.tagName&&"HEAD"===d[dv_i].parentElement.tagName;
this.dvStep=3;return E(this,j,e,a,g,c,k,m,d)}this.dvOther++;p&&p.match(/dvbs_src\.js/)&&(k=dv_Contains(window._dv_win._dvScripts,d[dv_i])?1:0,this.dvScripts.push({src:p,isContain:k}))}};this.sendRequest=function(e){this.perf&&this.perf.addTime("r5");var a=dv_GetParam(e,"tagformat");a&&"2"==a?$dvbs.domUtilities.addScriptResource(e,document.body):dv_sendScriptRequest(e);this.perf&&this.perf.addTime("r6");return!0};this.isApplicable=function(){return!0};this.onFailure=function(){var e=window._dv_win._dvScripts,
a=this.dv_script;null!=e&&(void 0!=e&&a)&&(a=e.indexOf(a),-1!=a&&e.splice(a,1))};window.debugScript&&(window.CreateUrl=E);this.getVersionParamName=function(){return"ver"};this.getVersion=function(){return"30"}};


function dvbs_src_main(dvbs_baseHandlerIns, dvbs_handlersDefs) {

    var getCurrentTime = function() {
        "use strict";
        if (Date.now) {
            return Date.now();
        }
        return (new Date()).getTime();
    };
    /**
     * r0 - Start
     * r1 - Before exec
     * r2 - After exec
     * r3 - Start createRequest
     * r4 - End createRequest
     * r5 - Start sendRequest
     * r6 - End sendRequest
     * r7 - In callback
     */

    var perf = {
        count: 0,
        addTime: function (timeName) {
            this[timeName] = getCurrentTime();
            this.count += 1;
        }
    };
    perf.addTime('r0');

    this.bs_baseHandlerIns = dvbs_baseHandlerIns;
    this.bs_handlersDefs = dvbs_handlersDefs;

    this.exec = function() {
        perf.addTime('r1');
        try {
            window._dv_win = (window._dv_win || window);
            window._dv_win.$dvbs = (window._dv_win.$dvbs || new dvBsType());

            window._dv_win.dv_config = window._dv_win.dv_config || { };
            window._dv_win.dv_config.bsErrAddress = window._dv_win.dv_config.bsAddress || 'rtb0.doubleverify.com';

            for(var index = 0; index < this.bs_handlersDefs.length; index++) {
                if (this.bs_handlersDefs[index] && this.bs_handlersDefs[index].handler)
                    this.bs_handlersDefs[index].handler.perf = perf;
            }
            this.bs_baseHandlerIns.perf = perf;

            var errorsArr = (new dv_rolloutManager(this.bs_handlersDefs, this.bs_baseHandlerIns)).handle();
            if (errorsArr && errorsArr.length > 0)
                dv_SendErrorImp(window._dv_win.dv_config.bsErrAddress + '/verify.js?ctx=818052&cmp=1619415&num=6', errorsArr);
        }
        catch(e) {
            try {
                dv_SendErrorImp(window._dv_win.dv_config.bsErrAddress + '/verify.js?ctx=818052&cmp=1619415&num=6&dvp_isLostImp=1', { dvp_jsErrMsg: encodeURIComponent(e) });
            } catch(e) { }
        }
        perf.addTime('r2');
    };
};

try {
    window._dv_win = window._dv_win || window;
    var dv_baseHandlerIns = new dv_baseHandler();
	

    var dv_handlersDefs = [];
    (new dvbs_src_main(dv_baseHandlerIns, dv_handlersDefs)).exec();
} catch (e) { }