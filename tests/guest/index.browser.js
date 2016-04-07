(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var prefix = 'sessionAccessId-';

function getId(data) {
    var id;

    if(data && data.id && ~data.id.indexOf(prefix)) {
        id = data.id;
    }

    return id;
}

module.exports = getId;

},{}],2:[function(require,module,exports){

var crel = require('crel'),
    prefix = 'sessionAccessId-',
    getId = require('./getId'),
    sessionRequests = [],
    source,
    connected = false;

function createId() {
    return prefix + Date.now();
}

var iframe,
    contentWindow,
    callbacks = {};

function handleMessage(event) {
    var response = event.data,
        sessionAccessId = getId(response);

    if(sessionAccessId === 'sessionAccessId-connected') {
        connected = true;
        return;
    }

    var callback = callbacks[sessionAccessId];

    console.log(response.data);

    if(sessionAccessId && callback) {
        callback(response.error, response.data);
    }
}

function init(sourceUrl, parent) {
    source = sourceUrl;
    parent = parent || document.body;

    iframe = crel('iframe', {
            src: source,
            width: 0,
            height: 0,
            style: 'display: none;'
        }
    );

    parent.appendChild(iframe);

    function checkConnected() {
        if (connected) {
            while(sessionRequests.length) {
                message.apply(null, sessionRequests.pop());
            }

            return;
        }

        message('connect');

        setTimeout(checkConnected, 100);
    }

    if(!contentWindow) {
        contentWindow = iframe.contentWindow;

        window.addEventListener('message', handleMessage);

        checkConnected();
    }

    return parent;
}

function close() {
    window.removeEventListener('message', handleMessage);
}

function message(method, key, value, callback) {
    if(!connected && method !== 'connect') {
        sessionRequests.push(Array.prototype.slice.call(arguments));
    }

    var id = createId();

    callbacks[id] = callback;

    contentWindow.postMessage({
        method: method,
        key: key,
        value: value,
        id: id
    }, source);
}

function get(key, callback) {
    if(!callback) {
        throw(new Error('callback required for get'));
    }

    message('get', key, null, callback);
}

function set(key, value, callback) {
    message('set', key, value, null, callback);
}

function remove(key, callback) {
    message('remove', key, null, callback);
}

module.exports =  {
    get: get,
    set: set,
    remove: remove,
    init: init,
    close: close
};

},{"./getId":1,"crel":3}],3:[function(require,module,exports){
//Copyright (C) 2012 Kory Nunn

//Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

//The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

/*

    This code is not formatted for readability, but rather run-speed and to assist compilers.

    However, the code's intention should be transparent.

    *** IE SUPPORT ***

    If you require this library to work in IE7, add the following after declaring crel.

    var testDiv = document.createElement('div'),
        testLabel = document.createElement('label');

    testDiv.setAttribute('class', 'a');
    testDiv['className'] !== 'a' ? crel.attrMap['class'] = 'className':undefined;
    testDiv.setAttribute('name','a');
    testDiv['name'] !== 'a' ? crel.attrMap['name'] = function(element, value){
        element.id = value;
    }:undefined;


    testLabel.setAttribute('for', 'a');
    testLabel['htmlFor'] !== 'a' ? crel.attrMap['for'] = 'htmlFor':undefined;



*/

(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.crel = factory();
    }
}(this, function () {
    var fn = 'function',
        obj = 'object',
        nodeType = 'nodeType',
        textContent = 'textContent',
        setAttribute = 'setAttribute',
        attrMapString = 'attrMap',
        isNodeString = 'isNode',
        isElementString = 'isElement',
        d = typeof document === obj ? document : {},
        isType = function(a, type){
            return typeof a === type;
        },
        isNode = typeof Node === fn ? function (object) {
            return object instanceof Node;
        } :
        // in IE <= 8 Node is an object, obviously..
        function(object){
            return object &&
                isType(object, obj) &&
                (nodeType in object) &&
                isType(object.ownerDocument,obj);
        },
        isElement = function (object) {
            return crel[isNodeString](object) && object[nodeType] === 1;
        },
        isArray = function(a){
            return a instanceof Array;
        },
        appendChild = function(element, child) {
          if(!crel[isNodeString](child)){
              child = d.createTextNode(child);
          }
          element.appendChild(child);
        };


    function crel(){
        var args = arguments, //Note: assigned to a variable to assist compilers. Saves about 40 bytes in closure compiler. Has negligable effect on performance.
            element = args[0],
            child,
            settings = args[1],
            childIndex = 2,
            argumentsLength = args.length,
            attributeMap = crel[attrMapString];

        element = crel[isElementString](element) ? element : d.createElement(element);
        // shortcut
        if(argumentsLength === 1){
            return element;
        }

        if(!isType(settings,obj) || crel[isNodeString](settings) || isArray(settings)) {
            --childIndex;
            settings = null;
        }

        // shortcut if there is only one child that is a string
        if((argumentsLength - childIndex) === 1 && isType(args[childIndex], 'string') && element[textContent] !== undefined){
            element[textContent] = args[childIndex];
        }else{
            for(; childIndex < argumentsLength; ++childIndex){
                child = args[childIndex];

                if(child == null){
                    continue;
                }

                if (isArray(child)) {
                  for (var i=0; i < child.length; ++i) {
                    appendChild(element, child[i]);
                  }
                } else {
                  appendChild(element, child);
                }
            }
        }

        for(var key in settings){
            if(!attributeMap[key]){
                element[setAttribute](key, settings[key]);
            }else{
                var attr = attributeMap[key];
                if(typeof attr === fn){
                    attr(element, settings[key]);
                }else{
                    element[setAttribute](attr, settings[key]);
                }
            }
        }

        return element;
    }

    // Used for mapping one kind of attribute to the supported version of that in bad browsers.
    crel[attrMapString] = {};

    crel[isElementString] = isElement;

    crel[isNodeString] = isNode;

    if(typeof Proxy !== 'undefined'){
        crel.proxy = new Proxy(crel, {
            get: function(target, key){
                !(key in crel) && (crel[key] = crel.bind(null, key));
                return crel[key];
            }
        });
    }

    return crel;
}));

},{}],4:[function(require,module,exports){
var doc = {
    document: typeof document !== 'undefined' ? document : null,
    setDocument: function(d){
        this.document = d;
    }
};

var arrayProto = [],
    isList = require('./isList'),
    getTargets = require('./getTargets')(doc.document),
    getTarget = require('./getTarget')(doc.document),
    space = ' ';


///[README.md]

function isIn(array, item){
    for(var i = 0; i < array.length; i++) {
        if(item === array[i]){
            return true;
        }
    }
}

/**

    ## .find

    finds elements that match the query within the scope of target

        //fluent
        doc(target).find(query);

        //legacy
        doc.find(target, query);
*/

function find(target, query){
    target = getTargets(target);
    if(query == null){
        return target;
    }

    if(isList(target)){
        var results = [];
        for (var i = 0; i < target.length; i++) {
            var subResults = doc.find(target[i], query);
            for(var j = 0; j < subResults.length; j++) {
                if(!isIn(results, subResults[j])){
                    results.push(subResults[j]);
                }
            }
        }
        return results;
    }

    return target ? target.querySelectorAll(query) : [];
}

/**

    ## .findOne

    finds the first element that matches the query within the scope of target

        //fluent
        doc(target).findOne(query);

        //legacy
        doc.findOne(target, query);
*/

function findOne(target, query){
    target = getTarget(target);
    if(query == null){
        return target;
    }

    if(isList(target)){
        var result;
        for (var i = 0; i < target.length; i++) {
            result = findOne(target[i], query);
            if(result){
                break;
            }
        }
        return result;
    }

    return target ? target.querySelector(query) : null;
}

/**

    ## .closest

    recurses up the DOM from the target node, checking if the current element matches the query

        //fluent
        doc(target).closest(query);

        //legacy
        doc.closest(target, query);
*/

function closest(target, query){
    target = getTarget(target);

    if(isList(target)){
        target = target[0];
    }

    while(
        target &&
        target.ownerDocument &&
        !is(target, query)
    ){
        target = target.parentNode;
    }

    return target === doc.document && target !== query ? null : target;
}

/**

    ## .is

    returns true if the target element matches the query

        //fluent
        doc(target).is(query);

        //legacy
        doc.is(target, query);
*/

function is(target, query){
    target = getTarget(target);

    if(isList(target)){
        target = target[0];
    }

    if(!target.ownerDocument || typeof query !== 'string'){
        return target === query;
    }

    if(target === query){
        return true;
    }

    var parentless = !target.parentNode;

    if(parentless){
        // Give the element a parent so that .querySelectorAll can be used
        document.createDocumentFragment().appendChild(target);
    }

    var result = arrayProto.indexOf.call(find(target.parentNode, query), target) >= 0;

    if(parentless){
        target.parentNode.removeChild(target);
    }

    return result;
}

/**

    ## .addClass

    adds classes to the target (space separated string or array)

        //fluent
        doc(target).addClass(query);

        //legacy
        doc.addClass(target, query);
*/

function addClass(target, classes){
    target = getTargets(target);

    if(isList(target)){
        for (var i = 0; i < target.length; i++) {
            addClass(target[i], classes);
        }
        return this;
    }
    if(!classes){
        return this;
    }

    var classes = Array.isArray(classes) ? classes : classes.split(space),
        currentClasses = target.classList ? null : target.className.split(space);

    for(var i = 0; i < classes.length; i++){
        var classToAdd = classes[i];
        if(!classToAdd || classToAdd === space){
            continue;
        }
        if(target.classList){
            target.classList.add(classToAdd);
        } else if(!currentClasses.indexOf(classToAdd)>=0){
            currentClasses.push(classToAdd);
        }
    }
    if(!target.classList){
        target.className = currentClasses.join(space);
    }
    return this;
}

/**

    ## .removeClass

    removes classes from the target (space separated string or array)

        //fluent
        doc(target).removeClass(query);

        //legacy
        doc.removeClass(target, query);
*/

function removeClass(target, classes){
    target = getTargets(target);

    if(isList(target)){
        for (var i = 0; i < target.length; i++) {
            removeClass(target[i], classes);
        }
        return this;
    }

    if(!classes){
        return this;
    }

    var classes = Array.isArray(classes) ? classes : classes.split(space),
        currentClasses = target.classList ? null : target.className.split(space);

    for(var i = 0; i < classes.length; i++){
        var classToRemove = classes[i];
        if(!classToRemove || classToRemove === space){
            continue;
        }
        if(target.classList){
            target.classList.remove(classToRemove);
            continue;
        }
        var removeIndex = currentClasses.indexOf(classToRemove);
        if(removeIndex >= 0){
            currentClasses.splice(removeIndex, 1);
        }
    }
    if(!target.classList){
        target.className = currentClasses.join(space);
    }
    return this;
}

function addEvent(settings){
    var target = getTarget(settings.target);
    if(target){
        target.addEventListener(settings.event, settings.callback, false);
    }else{
        console.warn('No elements matched the selector, so no events were bound.');
    }
}

/**

    ## .on

    binds a callback to a target when a DOM event is raised.

        //fluent
        doc(target/proxy).on(events, target[optional], callback);

    note: if a target is passed to the .on function, doc's target will be used as the proxy.

        //legacy
        doc.on(events, target, query, proxy[optional]);
*/

function on(events, target, callback, proxy){

    proxy = getTargets(proxy);

    if(!proxy){
        target = getTargets(target);
        // handles multiple targets
        if(isList(target)){
            var multiRemoveCallbacks = [];
            for (var i = 0; i < target.length; i++) {
                multiRemoveCallbacks.push(on(events, target[i], callback, proxy));
            }
            return function(){
                while(multiRemoveCallbacks.length){
                    multiRemoveCallbacks.pop();
                }
            };
        }
    }

    // handles multiple proxies
    // Already handles multiple proxies and targets,
    // because the target loop calls this loop.
    if(isList(proxy)){
        var multiRemoveCallbacks = [];
        for (var i = 0; i < proxy.length; i++) {
            multiRemoveCallbacks.push(on(events, target, callback, proxy[i]));
        }
        return function(){
            while(multiRemoveCallbacks.length){
                multiRemoveCallbacks.pop();
            }
        };
    }

    var removeCallbacks = [];

    if(typeof events === 'string'){
        events = events.split(space);
    }

    for(var i = 0; i < events.length; i++){
        var eventSettings = {};
        if(proxy){
            if(proxy === true){
                proxy = doc.document;
            }
            eventSettings.target = proxy;
            eventSettings.callback = function(event){
                var closestTarget = closest(event.target, target);
                if(closestTarget){
                    callback(event, closestTarget);
                }
            };
        }else{
            eventSettings.target = target;
            eventSettings.callback = callback;
        }

        eventSettings.event = events[i];

        addEvent(eventSettings);

        removeCallbacks.push(eventSettings);
    }

    return function(){
        while(removeCallbacks.length){
            var removeCallback = removeCallbacks.pop();
            getTarget(removeCallback.target).removeEventListener(removeCallback.event, removeCallback.callback);
        }
    }
}

/**

    ## .off

    removes events assigned to a target.

        //fluent
        doc(target/proxy).off(events, target[optional], callback);

    note: if a target is passed to the .on function, doc's target will be used as the proxy.

        //legacy
        doc.off(events, target, callback, proxy);
*/

function off(events, target, callback, proxy){
    if(isList(target)){
        for (var i = 0; i < target.length; i++) {
            off(events, target[i], callback, proxy);
        }
        return this;
    }
    if(proxy instanceof Array){
        for (var i = 0; i < proxy.length; i++) {
            off(events, target, callback, proxy[i]);
        }
        return this;
    }

    if(typeof events === 'string'){
        events = events.split(space);
    }

    if(typeof callback !== 'function'){
        proxy = callback;
        callback = null;
    }

    proxy = proxy ? getTarget(proxy) : doc.document;

    var targets = typeof target === 'string' ? find(target, proxy) : [target];

    for(var targetIndex = 0; targetIndex < targets.length; targetIndex++){
        var currentTarget = targets[targetIndex];

        for(var i = 0; i < events.length; i++){
            currentTarget.removeEventListener(events[i], callback);
        }
    }
    return this;
}

/**

    ## .append

    adds elements to a target

        //fluent
        doc(target).append(children);

        //legacy
        doc.append(target, children);
*/

function append(target, children){
    var target = getTarget(target),
        children = getTarget(children);

    if(isList(target)){
        target = target[0];
    }

    if(isList(children)){
        for (var i = 0; i < children.length; i++) {
            append(target, children[i]);
        }
        return;
    }

    target.appendChild(children);
}

/**

    ## .prepend

    adds elements to the front of a target

        //fluent
        doc(target).prepend(children);

        //legacy
        doc.prepend(target, children);
*/

function prepend(target, children){
    var target = getTarget(target),
        children = getTarget(children);

    if(isList(target)){
        target = target[0];
    }

    if(isList(children)){
        //reversed because otherwise the would get put in in the wrong order.
        for (var i = children.length -1; i; i--) {
            prepend(target, children[i]);
        }
        return;
    }

    target.insertBefore(children, target.firstChild);
}

/**

    ## .isVisible

    checks if an element or any of its parents display properties are set to 'none'

        //fluent
        doc(target).isVisible();

        //legacy
        doc.isVisible(target);
*/

function isVisible(target){
    var target = getTarget(target);
    if(!target){
        return;
    }
    if(isList(target)){
        var i = -1;

        while (target[i++] && isVisible(target[i])) {}
        return target.length >= i;
    }
    while(target.parentNode && target.style.display !== 'none'){
        target = target.parentNode;
    }

    return target === doc.document;
}

/**

    ## .indexOfElement

    returns the index of the element within it's parent element.

        //fluent
        doc(target).indexOfElement();

        //legacy
        doc.indexOfElement(target);

*/

function indexOfElement(target) {
    target = getTargets(target);
    if(!target){
        return;
    }

    if(isList(target)){
        target = target[0];
    }

    var i = -1;

    var parent = target.parentElement;

    if(!parent){
        return i;
    }

    while(parent.children[++i] !== target){}

    return i;
}


/**

    ## .ready

    call a callback when the document is ready.

    returns -1 if there is no parentElement on the target.

        //fluent
        doc().ready(callback);

        //legacy
        doc.ready(callback);
*/

function ready(callback){
    if(doc.document && (doc.document.readyState === 'complete' || doc.document.readyState === 'interactive')){
        callback();
    }else if(window.attachEvent){
        document.attachEvent("onreadystatechange", callback);
        window.attachEvent("onLoad",callback);
    }else if(document.addEventListener){
        document.addEventListener("DOMContentLoaded",callback,false);
    }
}

doc.find = find;
doc.findOne = findOne;
doc.closest = closest;
doc.is = is;
doc.addClass = addClass;
doc.removeClass = removeClass;
doc.off = off;
doc.on = on;
doc.append = append;
doc.prepend = prepend;
doc.isVisible = isVisible;
doc.ready = ready;
doc.indexOfElement = indexOfElement;

module.exports = doc;
},{"./getTarget":6,"./getTargets":7,"./isList":8}],5:[function(require,module,exports){
var doc = require('./doc'),
    isList = require('./isList'),
    getTargets = require('./getTargets')(doc.document),
    flocProto = [];

function Floc(items){
    this.push.apply(this, items);
}
Floc.prototype = flocProto;
flocProto.constructor = Floc;

function floc(target){
    var instance = getTargets(target);

    if(!isList(instance)){
        if(instance){
            instance = [instance];
        }else{
            instance = [];
        }
    }
    return new Floc(instance);
}

var returnsSelf = 'addClass removeClass append prepend'.split(' ');

for(var key in doc){
    if(typeof doc[key] === 'function'){
        floc[key] = doc[key];
        flocProto[key] = (function(key){
            var instance = this;
            // This is also extremely dodgy and fast
            return function(a,b,c,d,e,f){
                var result = doc[key](this, a,b,c,d,e,f);

                if(result !== doc && isList(result)){
                    return floc(result);
                }
                if(returnsSelf.indexOf(key) >=0){
                    return instance;
                }
                return result;
            };
        }(key));
    }
}
flocProto.on = function(events, target, callback){
    var proxy = this;
    if(typeof target === 'function'){
        callback = target;
        target = this;
        proxy = null;
    }
    doc.on(events, target, callback, proxy);
    return this;
};

flocProto.off = function(events, target, callback){
    var reference = this;
    if(typeof target === 'function'){
        callback = target;
        target = this;
        reference = null;
    }
    doc.off(events, target, callback, reference);
    return this;
};

flocProto.ready = function(callback){
    doc.ready(callback);
    return this;
};

flocProto.addClass = function(className){
    doc.addClass(this, className);
    return this;
};

flocProto.removeClass = function(className){
    doc.removeClass(this, className);
    return this;
};

module.exports = floc;
},{"./doc":4,"./getTargets":7,"./isList":8}],6:[function(require,module,exports){
var singleId = /^#\w+$/;

module.exports = function(document){
    return function getTarget(target){
        if(typeof target === 'string'){
            if(singleId.exec(target)){
                return document.getElementById(target.slice(1));
            }
            return document.querySelector(target);
        }

        return target;
    };
};
},{}],7:[function(require,module,exports){

var singleClass = /^\.\w+$/,
    singleId = /^#\w+$/,
    singleTag = /^\w+$/;

module.exports = function(document){
    return function getTargets(target){
        if(typeof target === 'string'){
            if(singleId.exec(target)){
                // If you have more than 1 of the same id in your page,
                // thats your own stupid fault.
                return [document.getElementById(target.slice(1))];
            }
            if(singleTag.exec(target)){
                return document.getElementsByTagName(target);
            }
            if(singleClass.exec(target)){
                return document.getElementsByClassName(target.slice(1));
            }
            return document.querySelectorAll(target);
        }

        return target;
    };
};
},{}],8:[function(require,module,exports){
module.exports = function isList(object){
    return object != null && typeof object === 'object' && 'length' in object && !('nodeType' in object) && object.self != object; // in IE8, window.self is window, but it is not === window, but it is == window......... WTF!?
}
},{}],9:[function(require,module,exports){
var crel = require('crel'),
    doc = require('doc-js'),
    session = require('../../guest.js');

var instructions = crel('div', {
        class: 'instructions'
    },
    crel('h3', 'cross-domain-storage guest')
);

doc.ready(function() {
    crel(document.body,
        instructions
    );

    session.init('http://localhost:9123');

    session.get('foo', function() {
        console.log('foo:', arguments);
    });

    window.session = session;

});

},{"../../guest.js":2,"crel":3,"doc-js":5}]},{},[9])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJnZXRJZC5qcyIsImd1ZXN0LmpzIiwibm9kZV9tb2R1bGVzL2NyZWwvY3JlbC5qcyIsIm5vZGVfbW9kdWxlcy9kb2MtanMvZG9jLmpzIiwibm9kZV9tb2R1bGVzL2RvYy1qcy9mbHVlbnQuanMiLCJub2RlX21vZHVsZXMvZG9jLWpzL2dldFRhcmdldC5qcyIsIm5vZGVfbW9kdWxlcy9kb2MtanMvZ2V0VGFyZ2V0cy5qcyIsIm5vZGVfbW9kdWxlcy9kb2MtanMvaXNMaXN0LmpzIiwidGVzdHMvZ3Vlc3QvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDemtCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgcHJlZml4ID0gJ3Nlc3Npb25BY2Nlc3NJZC0nO1xuXG5mdW5jdGlvbiBnZXRJZChkYXRhKSB7XG4gICAgdmFyIGlkO1xuXG4gICAgaWYoZGF0YSAmJiBkYXRhLmlkICYmIH5kYXRhLmlkLmluZGV4T2YocHJlZml4KSkge1xuICAgICAgICBpZCA9IGRhdGEuaWQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIGlkO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGdldElkO1xuIiwiXG52YXIgY3JlbCA9IHJlcXVpcmUoJ2NyZWwnKSxcbiAgICBwcmVmaXggPSAnc2Vzc2lvbkFjY2Vzc0lkLScsXG4gICAgZ2V0SWQgPSByZXF1aXJlKCcuL2dldElkJyksXG4gICAgc2Vzc2lvblJlcXVlc3RzID0gW10sXG4gICAgc291cmNlLFxuICAgIGNvbm5lY3RlZCA9IGZhbHNlO1xuXG5mdW5jdGlvbiBjcmVhdGVJZCgpIHtcbiAgICByZXR1cm4gcHJlZml4ICsgRGF0ZS5ub3coKTtcbn1cblxudmFyIGlmcmFtZSxcbiAgICBjb250ZW50V2luZG93LFxuICAgIGNhbGxiYWNrcyA9IHt9O1xuXG5mdW5jdGlvbiBoYW5kbGVNZXNzYWdlKGV2ZW50KSB7XG4gICAgdmFyIHJlc3BvbnNlID0gZXZlbnQuZGF0YSxcbiAgICAgICAgc2Vzc2lvbkFjY2Vzc0lkID0gZ2V0SWQocmVzcG9uc2UpO1xuXG4gICAgaWYoc2Vzc2lvbkFjY2Vzc0lkID09PSAnc2Vzc2lvbkFjY2Vzc0lkLWNvbm5lY3RlZCcpIHtcbiAgICAgICAgY29ubmVjdGVkID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBjYWxsYmFjayA9IGNhbGxiYWNrc1tzZXNzaW9uQWNjZXNzSWRdO1xuXG4gICAgY29uc29sZS5sb2cocmVzcG9uc2UuZGF0YSk7XG5cbiAgICBpZihzZXNzaW9uQWNjZXNzSWQgJiYgY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2socmVzcG9uc2UuZXJyb3IsIHJlc3BvbnNlLmRhdGEpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaW5pdChzb3VyY2VVcmwsIHBhcmVudCkge1xuICAgIHNvdXJjZSA9IHNvdXJjZVVybDtcbiAgICBwYXJlbnQgPSBwYXJlbnQgfHwgZG9jdW1lbnQuYm9keTtcblxuICAgIGlmcmFtZSA9IGNyZWwoJ2lmcmFtZScsIHtcbiAgICAgICAgICAgIHNyYzogc291cmNlLFxuICAgICAgICAgICAgd2lkdGg6IDAsXG4gICAgICAgICAgICBoZWlnaHQ6IDAsXG4gICAgICAgICAgICBzdHlsZTogJ2Rpc3BsYXk6IG5vbmU7J1xuICAgICAgICB9XG4gICAgKTtcblxuICAgIHBhcmVudC5hcHBlbmRDaGlsZChpZnJhbWUpO1xuXG4gICAgZnVuY3Rpb24gY2hlY2tDb25uZWN0ZWQoKSB7XG4gICAgICAgIGlmIChjb25uZWN0ZWQpIHtcbiAgICAgICAgICAgIHdoaWxlKHNlc3Npb25SZXF1ZXN0cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlLmFwcGx5KG51bGwsIHNlc3Npb25SZXF1ZXN0cy5wb3AoKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIG1lc3NhZ2UoJ2Nvbm5lY3QnKTtcblxuICAgICAgICBzZXRUaW1lb3V0KGNoZWNrQ29ubmVjdGVkLCAxMDApO1xuICAgIH1cblxuICAgIGlmKCFjb250ZW50V2luZG93KSB7XG4gICAgICAgIGNvbnRlbnRXaW5kb3cgPSBpZnJhbWUuY29udGVudFdpbmRvdztcblxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGhhbmRsZU1lc3NhZ2UpO1xuXG4gICAgICAgIGNoZWNrQ29ubmVjdGVkKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhcmVudDtcbn1cblxuZnVuY3Rpb24gY2xvc2UoKSB7XG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBoYW5kbGVNZXNzYWdlKTtcbn1cblxuZnVuY3Rpb24gbWVzc2FnZShtZXRob2QsIGtleSwgdmFsdWUsIGNhbGxiYWNrKSB7XG4gICAgaWYoIWNvbm5lY3RlZCAmJiBtZXRob2QgIT09ICdjb25uZWN0Jykge1xuICAgICAgICBzZXNzaW9uUmVxdWVzdHMucHVzaChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKTtcbiAgICB9XG5cbiAgICB2YXIgaWQgPSBjcmVhdGVJZCgpO1xuXG4gICAgY2FsbGJhY2tzW2lkXSA9IGNhbGxiYWNrO1xuXG4gICAgY29udGVudFdpbmRvdy5wb3N0TWVzc2FnZSh7XG4gICAgICAgIG1ldGhvZDogbWV0aG9kLFxuICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICBpZDogaWRcbiAgICB9LCBzb3VyY2UpO1xufVxuXG5mdW5jdGlvbiBnZXQoa2V5LCBjYWxsYmFjaykge1xuICAgIGlmKCFjYWxsYmFjaykge1xuICAgICAgICB0aHJvdyhuZXcgRXJyb3IoJ2NhbGxiYWNrIHJlcXVpcmVkIGZvciBnZXQnKSk7XG4gICAgfVxuXG4gICAgbWVzc2FnZSgnZ2V0Jywga2V5LCBudWxsLCBjYWxsYmFjayk7XG59XG5cbmZ1bmN0aW9uIHNldChrZXksIHZhbHVlLCBjYWxsYmFjaykge1xuICAgIG1lc3NhZ2UoJ3NldCcsIGtleSwgdmFsdWUsIG51bGwsIGNhbGxiYWNrKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlKGtleSwgY2FsbGJhY2spIHtcbiAgICBtZXNzYWdlKCdyZW1vdmUnLCBrZXksIG51bGwsIGNhbGxiYWNrKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSAge1xuICAgIGdldDogZ2V0LFxuICAgIHNldDogc2V0LFxuICAgIHJlbW92ZTogcmVtb3ZlLFxuICAgIGluaXQ6IGluaXQsXG4gICAgY2xvc2U6IGNsb3NlXG59O1xuIiwiLy9Db3B5cmlnaHQgKEMpIDIwMTIgS29yeSBOdW5uXHJcblxyXG4vL1Blcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XHJcblxyXG4vL1RoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxyXG5cclxuLy9USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cclxuXHJcbi8qXHJcblxyXG4gICAgVGhpcyBjb2RlIGlzIG5vdCBmb3JtYXR0ZWQgZm9yIHJlYWRhYmlsaXR5LCBidXQgcmF0aGVyIHJ1bi1zcGVlZCBhbmQgdG8gYXNzaXN0IGNvbXBpbGVycy5cclxuXHJcbiAgICBIb3dldmVyLCB0aGUgY29kZSdzIGludGVudGlvbiBzaG91bGQgYmUgdHJhbnNwYXJlbnQuXHJcblxyXG4gICAgKioqIElFIFNVUFBPUlQgKioqXHJcblxyXG4gICAgSWYgeW91IHJlcXVpcmUgdGhpcyBsaWJyYXJ5IHRvIHdvcmsgaW4gSUU3LCBhZGQgdGhlIGZvbGxvd2luZyBhZnRlciBkZWNsYXJpbmcgY3JlbC5cclxuXHJcbiAgICB2YXIgdGVzdERpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxyXG4gICAgICAgIHRlc3RMYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xhYmVsJyk7XHJcblxyXG4gICAgdGVzdERpdi5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2EnKTtcclxuICAgIHRlc3REaXZbJ2NsYXNzTmFtZSddICE9PSAnYScgPyBjcmVsLmF0dHJNYXBbJ2NsYXNzJ10gPSAnY2xhc3NOYW1lJzp1bmRlZmluZWQ7XHJcbiAgICB0ZXN0RGl2LnNldEF0dHJpYnV0ZSgnbmFtZScsJ2EnKTtcclxuICAgIHRlc3REaXZbJ25hbWUnXSAhPT0gJ2EnID8gY3JlbC5hdHRyTWFwWyduYW1lJ10gPSBmdW5jdGlvbihlbGVtZW50LCB2YWx1ZSl7XHJcbiAgICAgICAgZWxlbWVudC5pZCA9IHZhbHVlO1xyXG4gICAgfTp1bmRlZmluZWQ7XHJcblxyXG5cclxuICAgIHRlc3RMYWJlbC5zZXRBdHRyaWJ1dGUoJ2ZvcicsICdhJyk7XHJcbiAgICB0ZXN0TGFiZWxbJ2h0bWxGb3InXSAhPT0gJ2EnID8gY3JlbC5hdHRyTWFwWydmb3InXSA9ICdodG1sRm9yJzp1bmRlZmluZWQ7XHJcblxyXG5cclxuXHJcbiovXHJcblxyXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcclxuICAgIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcclxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XHJcbiAgICAgICAgZGVmaW5lKGZhY3RvcnkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByb290LmNyZWwgPSBmYWN0b3J5KCk7XHJcbiAgICB9XHJcbn0odGhpcywgZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGZuID0gJ2Z1bmN0aW9uJyxcclxuICAgICAgICBvYmogPSAnb2JqZWN0JyxcclxuICAgICAgICBub2RlVHlwZSA9ICdub2RlVHlwZScsXHJcbiAgICAgICAgdGV4dENvbnRlbnQgPSAndGV4dENvbnRlbnQnLFxyXG4gICAgICAgIHNldEF0dHJpYnV0ZSA9ICdzZXRBdHRyaWJ1dGUnLFxyXG4gICAgICAgIGF0dHJNYXBTdHJpbmcgPSAnYXR0ck1hcCcsXHJcbiAgICAgICAgaXNOb2RlU3RyaW5nID0gJ2lzTm9kZScsXHJcbiAgICAgICAgaXNFbGVtZW50U3RyaW5nID0gJ2lzRWxlbWVudCcsXHJcbiAgICAgICAgZCA9IHR5cGVvZiBkb2N1bWVudCA9PT0gb2JqID8gZG9jdW1lbnQgOiB7fSxcclxuICAgICAgICBpc1R5cGUgPSBmdW5jdGlvbihhLCB0eXBlKXtcclxuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiBhID09PSB0eXBlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaXNOb2RlID0gdHlwZW9mIE5vZGUgPT09IGZuID8gZnVuY3Rpb24gKG9iamVjdCkge1xyXG4gICAgICAgICAgICByZXR1cm4gb2JqZWN0IGluc3RhbmNlb2YgTm9kZTtcclxuICAgICAgICB9IDpcclxuICAgICAgICAvLyBpbiBJRSA8PSA4IE5vZGUgaXMgYW4gb2JqZWN0LCBvYnZpb3VzbHkuLlxyXG4gICAgICAgIGZ1bmN0aW9uKG9iamVjdCl7XHJcbiAgICAgICAgICAgIHJldHVybiBvYmplY3QgJiZcclxuICAgICAgICAgICAgICAgIGlzVHlwZShvYmplY3QsIG9iaikgJiZcclxuICAgICAgICAgICAgICAgIChub2RlVHlwZSBpbiBvYmplY3QpICYmXHJcbiAgICAgICAgICAgICAgICBpc1R5cGUob2JqZWN0Lm93bmVyRG9jdW1lbnQsb2JqKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGlzRWxlbWVudCA9IGZ1bmN0aW9uIChvYmplY3QpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGNyZWxbaXNOb2RlU3RyaW5nXShvYmplY3QpICYmIG9iamVjdFtub2RlVHlwZV0gPT09IDE7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBpc0FycmF5ID0gZnVuY3Rpb24oYSl7XHJcbiAgICAgICAgICAgIHJldHVybiBhIGluc3RhbmNlb2YgQXJyYXk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBhcHBlbmRDaGlsZCA9IGZ1bmN0aW9uKGVsZW1lbnQsIGNoaWxkKSB7XHJcbiAgICAgICAgICBpZighY3JlbFtpc05vZGVTdHJpbmddKGNoaWxkKSl7XHJcbiAgICAgICAgICAgICAgY2hpbGQgPSBkLmNyZWF0ZVRleHROb2RlKGNoaWxkKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoY2hpbGQpO1xyXG4gICAgICAgIH07XHJcblxyXG5cclxuICAgIGZ1bmN0aW9uIGNyZWwoKXtcclxuICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cywgLy9Ob3RlOiBhc3NpZ25lZCB0byBhIHZhcmlhYmxlIHRvIGFzc2lzdCBjb21waWxlcnMuIFNhdmVzIGFib3V0IDQwIGJ5dGVzIGluIGNsb3N1cmUgY29tcGlsZXIuIEhhcyBuZWdsaWdhYmxlIGVmZmVjdCBvbiBwZXJmb3JtYW5jZS5cclxuICAgICAgICAgICAgZWxlbWVudCA9IGFyZ3NbMF0sXHJcbiAgICAgICAgICAgIGNoaWxkLFxyXG4gICAgICAgICAgICBzZXR0aW5ncyA9IGFyZ3NbMV0sXHJcbiAgICAgICAgICAgIGNoaWxkSW5kZXggPSAyLFxyXG4gICAgICAgICAgICBhcmd1bWVudHNMZW5ndGggPSBhcmdzLmxlbmd0aCxcclxuICAgICAgICAgICAgYXR0cmlidXRlTWFwID0gY3JlbFthdHRyTWFwU3RyaW5nXTtcclxuXHJcbiAgICAgICAgZWxlbWVudCA9IGNyZWxbaXNFbGVtZW50U3RyaW5nXShlbGVtZW50KSA/IGVsZW1lbnQgOiBkLmNyZWF0ZUVsZW1lbnQoZWxlbWVudCk7XHJcbiAgICAgICAgLy8gc2hvcnRjdXRcclxuICAgICAgICBpZihhcmd1bWVudHNMZW5ndGggPT09IDEpe1xyXG4gICAgICAgICAgICByZXR1cm4gZWxlbWVudDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKCFpc1R5cGUoc2V0dGluZ3Msb2JqKSB8fCBjcmVsW2lzTm9kZVN0cmluZ10oc2V0dGluZ3MpIHx8IGlzQXJyYXkoc2V0dGluZ3MpKSB7XHJcbiAgICAgICAgICAgIC0tY2hpbGRJbmRleDtcclxuICAgICAgICAgICAgc2V0dGluZ3MgPSBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gc2hvcnRjdXQgaWYgdGhlcmUgaXMgb25seSBvbmUgY2hpbGQgdGhhdCBpcyBhIHN0cmluZ1xyXG4gICAgICAgIGlmKChhcmd1bWVudHNMZW5ndGggLSBjaGlsZEluZGV4KSA9PT0gMSAmJiBpc1R5cGUoYXJnc1tjaGlsZEluZGV4XSwgJ3N0cmluZycpICYmIGVsZW1lbnRbdGV4dENvbnRlbnRdICE9PSB1bmRlZmluZWQpe1xyXG4gICAgICAgICAgICBlbGVtZW50W3RleHRDb250ZW50XSA9IGFyZ3NbY2hpbGRJbmRleF07XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGZvcig7IGNoaWxkSW5kZXggPCBhcmd1bWVudHNMZW5ndGg7ICsrY2hpbGRJbmRleCl7XHJcbiAgICAgICAgICAgICAgICBjaGlsZCA9IGFyZ3NbY2hpbGRJbmRleF07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYoY2hpbGQgPT0gbnVsbCl7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGlzQXJyYXkoY2hpbGQpKSB7XHJcbiAgICAgICAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaSA8IGNoaWxkLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXBwZW5kQ2hpbGQoZWxlbWVudCwgY2hpbGRbaV0pO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICBhcHBlbmRDaGlsZChlbGVtZW50LCBjaGlsZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvcih2YXIga2V5IGluIHNldHRpbmdzKXtcclxuICAgICAgICAgICAgaWYoIWF0dHJpYnV0ZU1hcFtrZXldKXtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnRbc2V0QXR0cmlidXRlXShrZXksIHNldHRpbmdzW2tleV0pO1xyXG4gICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIHZhciBhdHRyID0gYXR0cmlidXRlTWFwW2tleV07XHJcbiAgICAgICAgICAgICAgICBpZih0eXBlb2YgYXR0ciA9PT0gZm4pe1xyXG4gICAgICAgICAgICAgICAgICAgIGF0dHIoZWxlbWVudCwgc2V0dGluZ3Nba2V5XSk7XHJcbiAgICAgICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50W3NldEF0dHJpYnV0ZV0oYXR0ciwgc2V0dGluZ3Nba2V5XSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBlbGVtZW50O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFVzZWQgZm9yIG1hcHBpbmcgb25lIGtpbmQgb2YgYXR0cmlidXRlIHRvIHRoZSBzdXBwb3J0ZWQgdmVyc2lvbiBvZiB0aGF0IGluIGJhZCBicm93c2Vycy5cclxuICAgIGNyZWxbYXR0ck1hcFN0cmluZ10gPSB7fTtcclxuXHJcbiAgICBjcmVsW2lzRWxlbWVudFN0cmluZ10gPSBpc0VsZW1lbnQ7XHJcblxyXG4gICAgY3JlbFtpc05vZGVTdHJpbmddID0gaXNOb2RlO1xyXG5cclxuICAgIGlmKHR5cGVvZiBQcm94eSAhPT0gJ3VuZGVmaW5lZCcpe1xyXG4gICAgICAgIGNyZWwucHJveHkgPSBuZXcgUHJveHkoY3JlbCwge1xyXG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKHRhcmdldCwga2V5KXtcclxuICAgICAgICAgICAgICAgICEoa2V5IGluIGNyZWwpICYmIChjcmVsW2tleV0gPSBjcmVsLmJpbmQobnVsbCwga2V5KSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY3JlbFtrZXldO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNyZWw7XHJcbn0pKTtcclxuIiwidmFyIGRvYyA9IHtcclxuICAgIGRvY3VtZW50OiB0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnID8gZG9jdW1lbnQgOiBudWxsLFxyXG4gICAgc2V0RG9jdW1lbnQ6IGZ1bmN0aW9uKGQpe1xyXG4gICAgICAgIHRoaXMuZG9jdW1lbnQgPSBkO1xyXG4gICAgfVxyXG59O1xyXG5cclxudmFyIGFycmF5UHJvdG8gPSBbXSxcclxuICAgIGlzTGlzdCA9IHJlcXVpcmUoJy4vaXNMaXN0JyksXHJcbiAgICBnZXRUYXJnZXRzID0gcmVxdWlyZSgnLi9nZXRUYXJnZXRzJykoZG9jLmRvY3VtZW50KSxcclxuICAgIGdldFRhcmdldCA9IHJlcXVpcmUoJy4vZ2V0VGFyZ2V0JykoZG9jLmRvY3VtZW50KSxcclxuICAgIHNwYWNlID0gJyAnO1xyXG5cclxuXHJcbi8vL1tSRUFETUUubWRdXHJcblxyXG5mdW5jdGlvbiBpc0luKGFycmF5LCBpdGVtKXtcclxuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGlmKGl0ZW0gPT09IGFycmF5W2ldKXtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG4vKipcclxuXHJcbiAgICAjIyAuZmluZFxyXG5cclxuICAgIGZpbmRzIGVsZW1lbnRzIHRoYXQgbWF0Y2ggdGhlIHF1ZXJ5IHdpdGhpbiB0aGUgc2NvcGUgb2YgdGFyZ2V0XHJcblxyXG4gICAgICAgIC8vZmx1ZW50XHJcbiAgICAgICAgZG9jKHRhcmdldCkuZmluZChxdWVyeSk7XHJcblxyXG4gICAgICAgIC8vbGVnYWN5XHJcbiAgICAgICAgZG9jLmZpbmQodGFyZ2V0LCBxdWVyeSk7XHJcbiovXHJcblxyXG5mdW5jdGlvbiBmaW5kKHRhcmdldCwgcXVlcnkpe1xyXG4gICAgdGFyZ2V0ID0gZ2V0VGFyZ2V0cyh0YXJnZXQpO1xyXG4gICAgaWYocXVlcnkgPT0gbnVsbCl7XHJcbiAgICAgICAgcmV0dXJuIHRhcmdldDtcclxuICAgIH1cclxuXHJcbiAgICBpZihpc0xpc3QodGFyZ2V0KSl7XHJcbiAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRhcmdldC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgc3ViUmVzdWx0cyA9IGRvYy5maW5kKHRhcmdldFtpXSwgcXVlcnkpO1xyXG4gICAgICAgICAgICBmb3IodmFyIGogPSAwOyBqIDwgc3ViUmVzdWx0cy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICAgICAgaWYoIWlzSW4ocmVzdWx0cywgc3ViUmVzdWx0c1tqXSkpe1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChzdWJSZXN1bHRzW2pdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0cztcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGFyZ2V0ID8gdGFyZ2V0LnF1ZXJ5U2VsZWN0b3JBbGwocXVlcnkpIDogW107XHJcbn1cclxuXHJcbi8qKlxyXG5cclxuICAgICMjIC5maW5kT25lXHJcblxyXG4gICAgZmluZHMgdGhlIGZpcnN0IGVsZW1lbnQgdGhhdCBtYXRjaGVzIHRoZSBxdWVyeSB3aXRoaW4gdGhlIHNjb3BlIG9mIHRhcmdldFxyXG5cclxuICAgICAgICAvL2ZsdWVudFxyXG4gICAgICAgIGRvYyh0YXJnZXQpLmZpbmRPbmUocXVlcnkpO1xyXG5cclxuICAgICAgICAvL2xlZ2FjeVxyXG4gICAgICAgIGRvYy5maW5kT25lKHRhcmdldCwgcXVlcnkpO1xyXG4qL1xyXG5cclxuZnVuY3Rpb24gZmluZE9uZSh0YXJnZXQsIHF1ZXJ5KXtcclxuICAgIHRhcmdldCA9IGdldFRhcmdldCh0YXJnZXQpO1xyXG4gICAgaWYocXVlcnkgPT0gbnVsbCl7XHJcbiAgICAgICAgcmV0dXJuIHRhcmdldDtcclxuICAgIH1cclxuXHJcbiAgICBpZihpc0xpc3QodGFyZ2V0KSl7XHJcbiAgICAgICAgdmFyIHJlc3VsdDtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRhcmdldC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICByZXN1bHQgPSBmaW5kT25lKHRhcmdldFtpXSwgcXVlcnkpO1xyXG4gICAgICAgICAgICBpZihyZXN1bHQpe1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGFyZ2V0ID8gdGFyZ2V0LnF1ZXJ5U2VsZWN0b3IocXVlcnkpIDogbnVsbDtcclxufVxyXG5cclxuLyoqXHJcblxyXG4gICAgIyMgLmNsb3Nlc3RcclxuXHJcbiAgICByZWN1cnNlcyB1cCB0aGUgRE9NIGZyb20gdGhlIHRhcmdldCBub2RlLCBjaGVja2luZyBpZiB0aGUgY3VycmVudCBlbGVtZW50IG1hdGNoZXMgdGhlIHF1ZXJ5XHJcblxyXG4gICAgICAgIC8vZmx1ZW50XHJcbiAgICAgICAgZG9jKHRhcmdldCkuY2xvc2VzdChxdWVyeSk7XHJcblxyXG4gICAgICAgIC8vbGVnYWN5XHJcbiAgICAgICAgZG9jLmNsb3Nlc3QodGFyZ2V0LCBxdWVyeSk7XHJcbiovXHJcblxyXG5mdW5jdGlvbiBjbG9zZXN0KHRhcmdldCwgcXVlcnkpe1xyXG4gICAgdGFyZ2V0ID0gZ2V0VGFyZ2V0KHRhcmdldCk7XHJcblxyXG4gICAgaWYoaXNMaXN0KHRhcmdldCkpe1xyXG4gICAgICAgIHRhcmdldCA9IHRhcmdldFswXTtcclxuICAgIH1cclxuXHJcbiAgICB3aGlsZShcclxuICAgICAgICB0YXJnZXQgJiZcclxuICAgICAgICB0YXJnZXQub3duZXJEb2N1bWVudCAmJlxyXG4gICAgICAgICFpcyh0YXJnZXQsIHF1ZXJ5KVxyXG4gICAgKXtcclxuICAgICAgICB0YXJnZXQgPSB0YXJnZXQucGFyZW50Tm9kZTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGFyZ2V0ID09PSBkb2MuZG9jdW1lbnQgJiYgdGFyZ2V0ICE9PSBxdWVyeSA/IG51bGwgOiB0YXJnZXQ7XHJcbn1cclxuXHJcbi8qKlxyXG5cclxuICAgICMjIC5pc1xyXG5cclxuICAgIHJldHVybnMgdHJ1ZSBpZiB0aGUgdGFyZ2V0IGVsZW1lbnQgbWF0Y2hlcyB0aGUgcXVlcnlcclxuXHJcbiAgICAgICAgLy9mbHVlbnRcclxuICAgICAgICBkb2ModGFyZ2V0KS5pcyhxdWVyeSk7XHJcblxyXG4gICAgICAgIC8vbGVnYWN5XHJcbiAgICAgICAgZG9jLmlzKHRhcmdldCwgcXVlcnkpO1xyXG4qL1xyXG5cclxuZnVuY3Rpb24gaXModGFyZ2V0LCBxdWVyeSl7XHJcbiAgICB0YXJnZXQgPSBnZXRUYXJnZXQodGFyZ2V0KTtcclxuXHJcbiAgICBpZihpc0xpc3QodGFyZ2V0KSl7XHJcbiAgICAgICAgdGFyZ2V0ID0gdGFyZ2V0WzBdO1xyXG4gICAgfVxyXG5cclxuICAgIGlmKCF0YXJnZXQub3duZXJEb2N1bWVudCB8fCB0eXBlb2YgcXVlcnkgIT09ICdzdHJpbmcnKXtcclxuICAgICAgICByZXR1cm4gdGFyZ2V0ID09PSBxdWVyeTtcclxuICAgIH1cclxuXHJcbiAgICBpZih0YXJnZXQgPT09IHF1ZXJ5KXtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgcGFyZW50bGVzcyA9ICF0YXJnZXQucGFyZW50Tm9kZTtcclxuXHJcbiAgICBpZihwYXJlbnRsZXNzKXtcclxuICAgICAgICAvLyBHaXZlIHRoZSBlbGVtZW50IGEgcGFyZW50IHNvIHRoYXQgLnF1ZXJ5U2VsZWN0b3JBbGwgY2FuIGJlIHVzZWRcclxuICAgICAgICBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCkuYXBwZW5kQ2hpbGQodGFyZ2V0KTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgcmVzdWx0ID0gYXJyYXlQcm90by5pbmRleE9mLmNhbGwoZmluZCh0YXJnZXQucGFyZW50Tm9kZSwgcXVlcnkpLCB0YXJnZXQpID49IDA7XHJcblxyXG4gICAgaWYocGFyZW50bGVzcyl7XHJcbiAgICAgICAgdGFyZ2V0LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGFyZ2V0KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG4vKipcclxuXHJcbiAgICAjIyAuYWRkQ2xhc3NcclxuXHJcbiAgICBhZGRzIGNsYXNzZXMgdG8gdGhlIHRhcmdldCAoc3BhY2Ugc2VwYXJhdGVkIHN0cmluZyBvciBhcnJheSlcclxuXHJcbiAgICAgICAgLy9mbHVlbnRcclxuICAgICAgICBkb2ModGFyZ2V0KS5hZGRDbGFzcyhxdWVyeSk7XHJcblxyXG4gICAgICAgIC8vbGVnYWN5XHJcbiAgICAgICAgZG9jLmFkZENsYXNzKHRhcmdldCwgcXVlcnkpO1xyXG4qL1xyXG5cclxuZnVuY3Rpb24gYWRkQ2xhc3ModGFyZ2V0LCBjbGFzc2VzKXtcclxuICAgIHRhcmdldCA9IGdldFRhcmdldHModGFyZ2V0KTtcclxuXHJcbiAgICBpZihpc0xpc3QodGFyZ2V0KSl7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0YXJnZXQubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgYWRkQ2xhc3ModGFyZ2V0W2ldLCBjbGFzc2VzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgICBpZighY2xhc3Nlcyl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGNsYXNzZXMgPSBBcnJheS5pc0FycmF5KGNsYXNzZXMpID8gY2xhc3NlcyA6IGNsYXNzZXMuc3BsaXQoc3BhY2UpLFxyXG4gICAgICAgIGN1cnJlbnRDbGFzc2VzID0gdGFyZ2V0LmNsYXNzTGlzdCA/IG51bGwgOiB0YXJnZXQuY2xhc3NOYW1lLnNwbGl0KHNwYWNlKTtcclxuXHJcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgY2xhc3Nlcy5sZW5ndGg7IGkrKyl7XHJcbiAgICAgICAgdmFyIGNsYXNzVG9BZGQgPSBjbGFzc2VzW2ldO1xyXG4gICAgICAgIGlmKCFjbGFzc1RvQWRkIHx8IGNsYXNzVG9BZGQgPT09IHNwYWNlKXtcclxuICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHRhcmdldC5jbGFzc0xpc3Qpe1xyXG4gICAgICAgICAgICB0YXJnZXQuY2xhc3NMaXN0LmFkZChjbGFzc1RvQWRkKTtcclxuICAgICAgICB9IGVsc2UgaWYoIWN1cnJlbnRDbGFzc2VzLmluZGV4T2YoY2xhc3NUb0FkZCk+PTApe1xyXG4gICAgICAgICAgICBjdXJyZW50Q2xhc3Nlcy5wdXNoKGNsYXNzVG9BZGQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmKCF0YXJnZXQuY2xhc3NMaXN0KXtcclxuICAgICAgICB0YXJnZXQuY2xhc3NOYW1lID0gY3VycmVudENsYXNzZXMuam9pbihzcGFjZSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxufVxyXG5cclxuLyoqXHJcblxyXG4gICAgIyMgLnJlbW92ZUNsYXNzXHJcblxyXG4gICAgcmVtb3ZlcyBjbGFzc2VzIGZyb20gdGhlIHRhcmdldCAoc3BhY2Ugc2VwYXJhdGVkIHN0cmluZyBvciBhcnJheSlcclxuXHJcbiAgICAgICAgLy9mbHVlbnRcclxuICAgICAgICBkb2ModGFyZ2V0KS5yZW1vdmVDbGFzcyhxdWVyeSk7XHJcblxyXG4gICAgICAgIC8vbGVnYWN5XHJcbiAgICAgICAgZG9jLnJlbW92ZUNsYXNzKHRhcmdldCwgcXVlcnkpO1xyXG4qL1xyXG5cclxuZnVuY3Rpb24gcmVtb3ZlQ2xhc3ModGFyZ2V0LCBjbGFzc2VzKXtcclxuICAgIHRhcmdldCA9IGdldFRhcmdldHModGFyZ2V0KTtcclxuXHJcbiAgICBpZihpc0xpc3QodGFyZ2V0KSl7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0YXJnZXQubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgcmVtb3ZlQ2xhc3ModGFyZ2V0W2ldLCBjbGFzc2VzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgaWYoIWNsYXNzZXMpe1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBjbGFzc2VzID0gQXJyYXkuaXNBcnJheShjbGFzc2VzKSA/IGNsYXNzZXMgOiBjbGFzc2VzLnNwbGl0KHNwYWNlKSxcclxuICAgICAgICBjdXJyZW50Q2xhc3NlcyA9IHRhcmdldC5jbGFzc0xpc3QgPyBudWxsIDogdGFyZ2V0LmNsYXNzTmFtZS5zcGxpdChzcGFjZSk7XHJcblxyXG4gICAgZm9yKHZhciBpID0gMDsgaSA8IGNsYXNzZXMubGVuZ3RoOyBpKyspe1xyXG4gICAgICAgIHZhciBjbGFzc1RvUmVtb3ZlID0gY2xhc3Nlc1tpXTtcclxuICAgICAgICBpZighY2xhc3NUb1JlbW92ZSB8fCBjbGFzc1RvUmVtb3ZlID09PSBzcGFjZSl7XHJcbiAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZih0YXJnZXQuY2xhc3NMaXN0KXtcclxuICAgICAgICAgICAgdGFyZ2V0LmNsYXNzTGlzdC5yZW1vdmUoY2xhc3NUb1JlbW92ZSk7XHJcbiAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgcmVtb3ZlSW5kZXggPSBjdXJyZW50Q2xhc3Nlcy5pbmRleE9mKGNsYXNzVG9SZW1vdmUpO1xyXG4gICAgICAgIGlmKHJlbW92ZUluZGV4ID49IDApe1xyXG4gICAgICAgICAgICBjdXJyZW50Q2xhc3Nlcy5zcGxpY2UocmVtb3ZlSW5kZXgsIDEpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmKCF0YXJnZXQuY2xhc3NMaXN0KXtcclxuICAgICAgICB0YXJnZXQuY2xhc3NOYW1lID0gY3VycmVudENsYXNzZXMuam9pbihzcGFjZSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxufVxyXG5cclxuZnVuY3Rpb24gYWRkRXZlbnQoc2V0dGluZ3Mpe1xyXG4gICAgdmFyIHRhcmdldCA9IGdldFRhcmdldChzZXR0aW5ncy50YXJnZXQpO1xyXG4gICAgaWYodGFyZ2V0KXtcclxuICAgICAgICB0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihzZXR0aW5ncy5ldmVudCwgc2V0dGluZ3MuY2FsbGJhY2ssIGZhbHNlKTtcclxuICAgIH1lbHNle1xyXG4gICAgICAgIGNvbnNvbGUud2FybignTm8gZWxlbWVudHMgbWF0Y2hlZCB0aGUgc2VsZWN0b3IsIHNvIG5vIGV2ZW50cyB3ZXJlIGJvdW5kLicpO1xyXG4gICAgfVxyXG59XHJcblxyXG4vKipcclxuXHJcbiAgICAjIyAub25cclxuXHJcbiAgICBiaW5kcyBhIGNhbGxiYWNrIHRvIGEgdGFyZ2V0IHdoZW4gYSBET00gZXZlbnQgaXMgcmFpc2VkLlxyXG5cclxuICAgICAgICAvL2ZsdWVudFxyXG4gICAgICAgIGRvYyh0YXJnZXQvcHJveHkpLm9uKGV2ZW50cywgdGFyZ2V0W29wdGlvbmFsXSwgY2FsbGJhY2spO1xyXG5cclxuICAgIG5vdGU6IGlmIGEgdGFyZ2V0IGlzIHBhc3NlZCB0byB0aGUgLm9uIGZ1bmN0aW9uLCBkb2MncyB0YXJnZXQgd2lsbCBiZSB1c2VkIGFzIHRoZSBwcm94eS5cclxuXHJcbiAgICAgICAgLy9sZWdhY3lcclxuICAgICAgICBkb2Mub24oZXZlbnRzLCB0YXJnZXQsIHF1ZXJ5LCBwcm94eVtvcHRpb25hbF0pO1xyXG4qL1xyXG5cclxuZnVuY3Rpb24gb24oZXZlbnRzLCB0YXJnZXQsIGNhbGxiYWNrLCBwcm94eSl7XHJcblxyXG4gICAgcHJveHkgPSBnZXRUYXJnZXRzKHByb3h5KTtcclxuXHJcbiAgICBpZighcHJveHkpe1xyXG4gICAgICAgIHRhcmdldCA9IGdldFRhcmdldHModGFyZ2V0KTtcclxuICAgICAgICAvLyBoYW5kbGVzIG11bHRpcGxlIHRhcmdldHNcclxuICAgICAgICBpZihpc0xpc3QodGFyZ2V0KSl7XHJcbiAgICAgICAgICAgIHZhciBtdWx0aVJlbW92ZUNhbGxiYWNrcyA9IFtdO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRhcmdldC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgbXVsdGlSZW1vdmVDYWxsYmFja3MucHVzaChvbihldmVudHMsIHRhcmdldFtpXSwgY2FsbGJhY2ssIHByb3h5KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICB3aGlsZShtdWx0aVJlbW92ZUNhbGxiYWNrcy5sZW5ndGgpe1xyXG4gICAgICAgICAgICAgICAgICAgIG11bHRpUmVtb3ZlQ2FsbGJhY2tzLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBoYW5kbGVzIG11bHRpcGxlIHByb3hpZXNcclxuICAgIC8vIEFscmVhZHkgaGFuZGxlcyBtdWx0aXBsZSBwcm94aWVzIGFuZCB0YXJnZXRzLFxyXG4gICAgLy8gYmVjYXVzZSB0aGUgdGFyZ2V0IGxvb3AgY2FsbHMgdGhpcyBsb29wLlxyXG4gICAgaWYoaXNMaXN0KHByb3h5KSl7XHJcbiAgICAgICAgdmFyIG11bHRpUmVtb3ZlQ2FsbGJhY2tzID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm94eS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBtdWx0aVJlbW92ZUNhbGxiYWNrcy5wdXNoKG9uKGV2ZW50cywgdGFyZ2V0LCBjYWxsYmFjaywgcHJveHlbaV0pKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIHdoaWxlKG11bHRpUmVtb3ZlQ2FsbGJhY2tzLmxlbmd0aCl7XHJcbiAgICAgICAgICAgICAgICBtdWx0aVJlbW92ZUNhbGxiYWNrcy5wb3AoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHJlbW92ZUNhbGxiYWNrcyA9IFtdO1xyXG5cclxuICAgIGlmKHR5cGVvZiBldmVudHMgPT09ICdzdHJpbmcnKXtcclxuICAgICAgICBldmVudHMgPSBldmVudHMuc3BsaXQoc3BhY2UpO1xyXG4gICAgfVxyXG5cclxuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBldmVudHMubGVuZ3RoOyBpKyspe1xyXG4gICAgICAgIHZhciBldmVudFNldHRpbmdzID0ge307XHJcbiAgICAgICAgaWYocHJveHkpe1xyXG4gICAgICAgICAgICBpZihwcm94eSA9PT0gdHJ1ZSl7XHJcbiAgICAgICAgICAgICAgICBwcm94eSA9IGRvYy5kb2N1bWVudDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBldmVudFNldHRpbmdzLnRhcmdldCA9IHByb3h5O1xyXG4gICAgICAgICAgICBldmVudFNldHRpbmdzLmNhbGxiYWNrID0gZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgICAgICAgICAgICAgdmFyIGNsb3Nlc3RUYXJnZXQgPSBjbG9zZXN0KGV2ZW50LnRhcmdldCwgdGFyZ2V0KTtcclxuICAgICAgICAgICAgICAgIGlmKGNsb3Nlc3RUYXJnZXQpe1xyXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGV2ZW50LCBjbG9zZXN0VGFyZ2V0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgZXZlbnRTZXR0aW5ncy50YXJnZXQgPSB0YXJnZXQ7XHJcbiAgICAgICAgICAgIGV2ZW50U2V0dGluZ3MuY2FsbGJhY2sgPSBjYWxsYmFjaztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGV2ZW50U2V0dGluZ3MuZXZlbnQgPSBldmVudHNbaV07XHJcblxyXG4gICAgICAgIGFkZEV2ZW50KGV2ZW50U2V0dGluZ3MpO1xyXG5cclxuICAgICAgICByZW1vdmVDYWxsYmFja3MucHVzaChldmVudFNldHRpbmdzKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZnVuY3Rpb24oKXtcclxuICAgICAgICB3aGlsZShyZW1vdmVDYWxsYmFja3MubGVuZ3RoKXtcclxuICAgICAgICAgICAgdmFyIHJlbW92ZUNhbGxiYWNrID0gcmVtb3ZlQ2FsbGJhY2tzLnBvcCgpO1xyXG4gICAgICAgICAgICBnZXRUYXJnZXQocmVtb3ZlQ2FsbGJhY2sudGFyZ2V0KS5yZW1vdmVFdmVudExpc3RlbmVyKHJlbW92ZUNhbGxiYWNrLmV2ZW50LCByZW1vdmVDYWxsYmFjay5jYWxsYmFjayk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG4vKipcclxuXHJcbiAgICAjIyAub2ZmXHJcblxyXG4gICAgcmVtb3ZlcyBldmVudHMgYXNzaWduZWQgdG8gYSB0YXJnZXQuXHJcblxyXG4gICAgICAgIC8vZmx1ZW50XHJcbiAgICAgICAgZG9jKHRhcmdldC9wcm94eSkub2ZmKGV2ZW50cywgdGFyZ2V0W29wdGlvbmFsXSwgY2FsbGJhY2spO1xyXG5cclxuICAgIG5vdGU6IGlmIGEgdGFyZ2V0IGlzIHBhc3NlZCB0byB0aGUgLm9uIGZ1bmN0aW9uLCBkb2MncyB0YXJnZXQgd2lsbCBiZSB1c2VkIGFzIHRoZSBwcm94eS5cclxuXHJcbiAgICAgICAgLy9sZWdhY3lcclxuICAgICAgICBkb2Mub2ZmKGV2ZW50cywgdGFyZ2V0LCBjYWxsYmFjaywgcHJveHkpO1xyXG4qL1xyXG5cclxuZnVuY3Rpb24gb2ZmKGV2ZW50cywgdGFyZ2V0LCBjYWxsYmFjaywgcHJveHkpe1xyXG4gICAgaWYoaXNMaXN0KHRhcmdldCkpe1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGFyZ2V0Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIG9mZihldmVudHMsIHRhcmdldFtpXSwgY2FsbGJhY2ssIHByb3h5KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgICBpZihwcm94eSBpbnN0YW5jZW9mIEFycmF5KXtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByb3h5Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIG9mZihldmVudHMsIHRhcmdldCwgY2FsbGJhY2ssIHByb3h5W2ldKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgaWYodHlwZW9mIGV2ZW50cyA9PT0gJ3N0cmluZycpe1xyXG4gICAgICAgIGV2ZW50cyA9IGV2ZW50cy5zcGxpdChzcGFjZSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYodHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKXtcclxuICAgICAgICBwcm94eSA9IGNhbGxiYWNrO1xyXG4gICAgICAgIGNhbGxiYWNrID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwcm94eSA9IHByb3h5ID8gZ2V0VGFyZ2V0KHByb3h5KSA6IGRvYy5kb2N1bWVudDtcclxuXHJcbiAgICB2YXIgdGFyZ2V0cyA9IHR5cGVvZiB0YXJnZXQgPT09ICdzdHJpbmcnID8gZmluZCh0YXJnZXQsIHByb3h5KSA6IFt0YXJnZXRdO1xyXG5cclxuICAgIGZvcih2YXIgdGFyZ2V0SW5kZXggPSAwOyB0YXJnZXRJbmRleCA8IHRhcmdldHMubGVuZ3RoOyB0YXJnZXRJbmRleCsrKXtcclxuICAgICAgICB2YXIgY3VycmVudFRhcmdldCA9IHRhcmdldHNbdGFyZ2V0SW5kZXhdO1xyXG5cclxuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgZXZlbnRzLmxlbmd0aDsgaSsrKXtcclxuICAgICAgICAgICAgY3VycmVudFRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50c1tpXSwgY2FsbGJhY2spO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG59XHJcblxyXG4vKipcclxuXHJcbiAgICAjIyAuYXBwZW5kXHJcblxyXG4gICAgYWRkcyBlbGVtZW50cyB0byBhIHRhcmdldFxyXG5cclxuICAgICAgICAvL2ZsdWVudFxyXG4gICAgICAgIGRvYyh0YXJnZXQpLmFwcGVuZChjaGlsZHJlbik7XHJcblxyXG4gICAgICAgIC8vbGVnYWN5XHJcbiAgICAgICAgZG9jLmFwcGVuZCh0YXJnZXQsIGNoaWxkcmVuKTtcclxuKi9cclxuXHJcbmZ1bmN0aW9uIGFwcGVuZCh0YXJnZXQsIGNoaWxkcmVuKXtcclxuICAgIHZhciB0YXJnZXQgPSBnZXRUYXJnZXQodGFyZ2V0KSxcclxuICAgICAgICBjaGlsZHJlbiA9IGdldFRhcmdldChjaGlsZHJlbik7XHJcblxyXG4gICAgaWYoaXNMaXN0KHRhcmdldCkpe1xyXG4gICAgICAgIHRhcmdldCA9IHRhcmdldFswXTtcclxuICAgIH1cclxuXHJcbiAgICBpZihpc0xpc3QoY2hpbGRyZW4pKXtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGFwcGVuZCh0YXJnZXQsIGNoaWxkcmVuW2ldKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHRhcmdldC5hcHBlbmRDaGlsZChjaGlsZHJlbik7XHJcbn1cclxuXHJcbi8qKlxyXG5cclxuICAgICMjIC5wcmVwZW5kXHJcblxyXG4gICAgYWRkcyBlbGVtZW50cyB0byB0aGUgZnJvbnQgb2YgYSB0YXJnZXRcclxuXHJcbiAgICAgICAgLy9mbHVlbnRcclxuICAgICAgICBkb2ModGFyZ2V0KS5wcmVwZW5kKGNoaWxkcmVuKTtcclxuXHJcbiAgICAgICAgLy9sZWdhY3lcclxuICAgICAgICBkb2MucHJlcGVuZCh0YXJnZXQsIGNoaWxkcmVuKTtcclxuKi9cclxuXHJcbmZ1bmN0aW9uIHByZXBlbmQodGFyZ2V0LCBjaGlsZHJlbil7XHJcbiAgICB2YXIgdGFyZ2V0ID0gZ2V0VGFyZ2V0KHRhcmdldCksXHJcbiAgICAgICAgY2hpbGRyZW4gPSBnZXRUYXJnZXQoY2hpbGRyZW4pO1xyXG5cclxuICAgIGlmKGlzTGlzdCh0YXJnZXQpKXtcclxuICAgICAgICB0YXJnZXQgPSB0YXJnZXRbMF07XHJcbiAgICB9XHJcblxyXG4gICAgaWYoaXNMaXN0KGNoaWxkcmVuKSl7XHJcbiAgICAgICAgLy9yZXZlcnNlZCBiZWNhdXNlIG90aGVyd2lzZSB0aGUgd291bGQgZ2V0IHB1dCBpbiBpbiB0aGUgd3Jvbmcgb3JkZXIuXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IGNoaWxkcmVuLmxlbmd0aCAtMTsgaTsgaS0tKSB7XHJcbiAgICAgICAgICAgIHByZXBlbmQodGFyZ2V0LCBjaGlsZHJlbltpXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICB0YXJnZXQuaW5zZXJ0QmVmb3JlKGNoaWxkcmVuLCB0YXJnZXQuZmlyc3RDaGlsZCk7XHJcbn1cclxuXHJcbi8qKlxyXG5cclxuICAgICMjIC5pc1Zpc2libGVcclxuXHJcbiAgICBjaGVja3MgaWYgYW4gZWxlbWVudCBvciBhbnkgb2YgaXRzIHBhcmVudHMgZGlzcGxheSBwcm9wZXJ0aWVzIGFyZSBzZXQgdG8gJ25vbmUnXHJcblxyXG4gICAgICAgIC8vZmx1ZW50XHJcbiAgICAgICAgZG9jKHRhcmdldCkuaXNWaXNpYmxlKCk7XHJcblxyXG4gICAgICAgIC8vbGVnYWN5XHJcbiAgICAgICAgZG9jLmlzVmlzaWJsZSh0YXJnZXQpO1xyXG4qL1xyXG5cclxuZnVuY3Rpb24gaXNWaXNpYmxlKHRhcmdldCl7XHJcbiAgICB2YXIgdGFyZ2V0ID0gZ2V0VGFyZ2V0KHRhcmdldCk7XHJcbiAgICBpZighdGFyZ2V0KXtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBpZihpc0xpc3QodGFyZ2V0KSl7XHJcbiAgICAgICAgdmFyIGkgPSAtMTtcclxuXHJcbiAgICAgICAgd2hpbGUgKHRhcmdldFtpKytdICYmIGlzVmlzaWJsZSh0YXJnZXRbaV0pKSB7fVxyXG4gICAgICAgIHJldHVybiB0YXJnZXQubGVuZ3RoID49IGk7XHJcbiAgICB9XHJcbiAgICB3aGlsZSh0YXJnZXQucGFyZW50Tm9kZSAmJiB0YXJnZXQuc3R5bGUuZGlzcGxheSAhPT0gJ25vbmUnKXtcclxuICAgICAgICB0YXJnZXQgPSB0YXJnZXQucGFyZW50Tm9kZTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGFyZ2V0ID09PSBkb2MuZG9jdW1lbnQ7XHJcbn1cclxuXHJcbi8qKlxyXG5cclxuICAgICMjIC5pbmRleE9mRWxlbWVudFxyXG5cclxuICAgIHJldHVybnMgdGhlIGluZGV4IG9mIHRoZSBlbGVtZW50IHdpdGhpbiBpdCdzIHBhcmVudCBlbGVtZW50LlxyXG5cclxuICAgICAgICAvL2ZsdWVudFxyXG4gICAgICAgIGRvYyh0YXJnZXQpLmluZGV4T2ZFbGVtZW50KCk7XHJcblxyXG4gICAgICAgIC8vbGVnYWN5XHJcbiAgICAgICAgZG9jLmluZGV4T2ZFbGVtZW50KHRhcmdldCk7XHJcblxyXG4qL1xyXG5cclxuZnVuY3Rpb24gaW5kZXhPZkVsZW1lbnQodGFyZ2V0KSB7XHJcbiAgICB0YXJnZXQgPSBnZXRUYXJnZXRzKHRhcmdldCk7XHJcbiAgICBpZighdGFyZ2V0KXtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaWYoaXNMaXN0KHRhcmdldCkpe1xyXG4gICAgICAgIHRhcmdldCA9IHRhcmdldFswXTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgaSA9IC0xO1xyXG5cclxuICAgIHZhciBwYXJlbnQgPSB0YXJnZXQucGFyZW50RWxlbWVudDtcclxuXHJcbiAgICBpZighcGFyZW50KXtcclxuICAgICAgICByZXR1cm4gaTtcclxuICAgIH1cclxuXHJcbiAgICB3aGlsZShwYXJlbnQuY2hpbGRyZW5bKytpXSAhPT0gdGFyZ2V0KXt9XHJcblxyXG4gICAgcmV0dXJuIGk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuXHJcbiAgICAjIyAucmVhZHlcclxuXHJcbiAgICBjYWxsIGEgY2FsbGJhY2sgd2hlbiB0aGUgZG9jdW1lbnQgaXMgcmVhZHkuXHJcblxyXG4gICAgcmV0dXJucyAtMSBpZiB0aGVyZSBpcyBubyBwYXJlbnRFbGVtZW50IG9uIHRoZSB0YXJnZXQuXHJcblxyXG4gICAgICAgIC8vZmx1ZW50XHJcbiAgICAgICAgZG9jKCkucmVhZHkoY2FsbGJhY2spO1xyXG5cclxuICAgICAgICAvL2xlZ2FjeVxyXG4gICAgICAgIGRvYy5yZWFkeShjYWxsYmFjayk7XHJcbiovXHJcblxyXG5mdW5jdGlvbiByZWFkeShjYWxsYmFjayl7XHJcbiAgICBpZihkb2MuZG9jdW1lbnQgJiYgKGRvYy5kb2N1bWVudC5yZWFkeVN0YXRlID09PSAnY29tcGxldGUnIHx8IGRvYy5kb2N1bWVudC5yZWFkeVN0YXRlID09PSAnaW50ZXJhY3RpdmUnKSl7XHJcbiAgICAgICAgY2FsbGJhY2soKTtcclxuICAgIH1lbHNlIGlmKHdpbmRvdy5hdHRhY2hFdmVudCl7XHJcbiAgICAgICAgZG9jdW1lbnQuYXR0YWNoRXZlbnQoXCJvbnJlYWR5c3RhdGVjaGFuZ2VcIiwgY2FsbGJhY2spO1xyXG4gICAgICAgIHdpbmRvdy5hdHRhY2hFdmVudChcIm9uTG9hZFwiLGNhbGxiYWNrKTtcclxuICAgIH1lbHNlIGlmKGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIpe1xyXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsY2FsbGJhY2ssZmFsc2UpO1xyXG4gICAgfVxyXG59XHJcblxyXG5kb2MuZmluZCA9IGZpbmQ7XHJcbmRvYy5maW5kT25lID0gZmluZE9uZTtcclxuZG9jLmNsb3Nlc3QgPSBjbG9zZXN0O1xyXG5kb2MuaXMgPSBpcztcclxuZG9jLmFkZENsYXNzID0gYWRkQ2xhc3M7XHJcbmRvYy5yZW1vdmVDbGFzcyA9IHJlbW92ZUNsYXNzO1xyXG5kb2Mub2ZmID0gb2ZmO1xyXG5kb2Mub24gPSBvbjtcclxuZG9jLmFwcGVuZCA9IGFwcGVuZDtcclxuZG9jLnByZXBlbmQgPSBwcmVwZW5kO1xyXG5kb2MuaXNWaXNpYmxlID0gaXNWaXNpYmxlO1xyXG5kb2MucmVhZHkgPSByZWFkeTtcclxuZG9jLmluZGV4T2ZFbGVtZW50ID0gaW5kZXhPZkVsZW1lbnQ7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGRvYzsiLCJ2YXIgZG9jID0gcmVxdWlyZSgnLi9kb2MnKSxcclxuICAgIGlzTGlzdCA9IHJlcXVpcmUoJy4vaXNMaXN0JyksXHJcbiAgICBnZXRUYXJnZXRzID0gcmVxdWlyZSgnLi9nZXRUYXJnZXRzJykoZG9jLmRvY3VtZW50KSxcclxuICAgIGZsb2NQcm90byA9IFtdO1xyXG5cclxuZnVuY3Rpb24gRmxvYyhpdGVtcyl7XHJcbiAgICB0aGlzLnB1c2guYXBwbHkodGhpcywgaXRlbXMpO1xyXG59XHJcbkZsb2MucHJvdG90eXBlID0gZmxvY1Byb3RvO1xyXG5mbG9jUHJvdG8uY29uc3RydWN0b3IgPSBGbG9jO1xyXG5cclxuZnVuY3Rpb24gZmxvYyh0YXJnZXQpe1xyXG4gICAgdmFyIGluc3RhbmNlID0gZ2V0VGFyZ2V0cyh0YXJnZXQpO1xyXG5cclxuICAgIGlmKCFpc0xpc3QoaW5zdGFuY2UpKXtcclxuICAgICAgICBpZihpbnN0YW5jZSl7XHJcbiAgICAgICAgICAgIGluc3RhbmNlID0gW2luc3RhbmNlXTtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgaW5zdGFuY2UgPSBbXTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbmV3IEZsb2MoaW5zdGFuY2UpO1xyXG59XHJcblxyXG52YXIgcmV0dXJuc1NlbGYgPSAnYWRkQ2xhc3MgcmVtb3ZlQ2xhc3MgYXBwZW5kIHByZXBlbmQnLnNwbGl0KCcgJyk7XHJcblxyXG5mb3IodmFyIGtleSBpbiBkb2Mpe1xyXG4gICAgaWYodHlwZW9mIGRvY1trZXldID09PSAnZnVuY3Rpb24nKXtcclxuICAgICAgICBmbG9jW2tleV0gPSBkb2Nba2V5XTtcclxuICAgICAgICBmbG9jUHJvdG9ba2V5XSA9IChmdW5jdGlvbihrZXkpe1xyXG4gICAgICAgICAgICB2YXIgaW5zdGFuY2UgPSB0aGlzO1xyXG4gICAgICAgICAgICAvLyBUaGlzIGlzIGFsc28gZXh0cmVtZWx5IGRvZGd5IGFuZCBmYXN0XHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbihhLGIsYyxkLGUsZil7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gZG9jW2tleV0odGhpcywgYSxiLGMsZCxlLGYpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmKHJlc3VsdCAhPT0gZG9jICYmIGlzTGlzdChyZXN1bHQpKXtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmxvYyhyZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYocmV0dXJuc1NlbGYuaW5kZXhPZihrZXkpID49MCl7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGluc3RhbmNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9KGtleSkpO1xyXG4gICAgfVxyXG59XHJcbmZsb2NQcm90by5vbiA9IGZ1bmN0aW9uKGV2ZW50cywgdGFyZ2V0LCBjYWxsYmFjayl7XHJcbiAgICB2YXIgcHJveHkgPSB0aGlzO1xyXG4gICAgaWYodHlwZW9mIHRhcmdldCA9PT0gJ2Z1bmN0aW9uJyl7XHJcbiAgICAgICAgY2FsbGJhY2sgPSB0YXJnZXQ7XHJcbiAgICAgICAgdGFyZ2V0ID0gdGhpcztcclxuICAgICAgICBwcm94eSA9IG51bGw7XHJcbiAgICB9XHJcbiAgICBkb2Mub24oZXZlbnRzLCB0YXJnZXQsIGNhbGxiYWNrLCBwcm94eSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbmZsb2NQcm90by5vZmYgPSBmdW5jdGlvbihldmVudHMsIHRhcmdldCwgY2FsbGJhY2spe1xyXG4gICAgdmFyIHJlZmVyZW5jZSA9IHRoaXM7XHJcbiAgICBpZih0eXBlb2YgdGFyZ2V0ID09PSAnZnVuY3Rpb24nKXtcclxuICAgICAgICBjYWxsYmFjayA9IHRhcmdldDtcclxuICAgICAgICB0YXJnZXQgPSB0aGlzO1xyXG4gICAgICAgIHJlZmVyZW5jZSA9IG51bGw7XHJcbiAgICB9XHJcbiAgICBkb2Mub2ZmKGV2ZW50cywgdGFyZ2V0LCBjYWxsYmFjaywgcmVmZXJlbmNlKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuZmxvY1Byb3RvLnJlYWR5ID0gZnVuY3Rpb24oY2FsbGJhY2spe1xyXG4gICAgZG9jLnJlYWR5KGNhbGxiYWNrKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuZmxvY1Byb3RvLmFkZENsYXNzID0gZnVuY3Rpb24oY2xhc3NOYW1lKXtcclxuICAgIGRvYy5hZGRDbGFzcyh0aGlzLCBjbGFzc05hbWUpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5mbG9jUHJvdG8ucmVtb3ZlQ2xhc3MgPSBmdW5jdGlvbihjbGFzc05hbWUpe1xyXG4gICAgZG9jLnJlbW92ZUNsYXNzKHRoaXMsIGNsYXNzTmFtZSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZmxvYzsiLCJ2YXIgc2luZ2xlSWQgPSAvXiNcXHcrJC87XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZG9jdW1lbnQpe1xuICAgIHJldHVybiBmdW5jdGlvbiBnZXRUYXJnZXQodGFyZ2V0KXtcbiAgICAgICAgaWYodHlwZW9mIHRhcmdldCA9PT0gJ3N0cmluZycpe1xuICAgICAgICAgICAgaWYoc2luZ2xlSWQuZXhlYyh0YXJnZXQpKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGFyZ2V0LnNsaWNlKDEpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHRhcmdldCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgIH07XG59OyIsIlxudmFyIHNpbmdsZUNsYXNzID0gL15cXC5cXHcrJC8sXG4gICAgc2luZ2xlSWQgPSAvXiNcXHcrJC8sXG4gICAgc2luZ2xlVGFnID0gL15cXHcrJC87XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZG9jdW1lbnQpe1xuICAgIHJldHVybiBmdW5jdGlvbiBnZXRUYXJnZXRzKHRhcmdldCl7XG4gICAgICAgIGlmKHR5cGVvZiB0YXJnZXQgPT09ICdzdHJpbmcnKXtcbiAgICAgICAgICAgIGlmKHNpbmdsZUlkLmV4ZWModGFyZ2V0KSl7XG4gICAgICAgICAgICAgICAgLy8gSWYgeW91IGhhdmUgbW9yZSB0aGFuIDEgb2YgdGhlIHNhbWUgaWQgaW4geW91ciBwYWdlLFxuICAgICAgICAgICAgICAgIC8vIHRoYXRzIHlvdXIgb3duIHN0dXBpZCBmYXVsdC5cbiAgICAgICAgICAgICAgICByZXR1cm4gW2RvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRhcmdldC5zbGljZSgxKSldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoc2luZ2xlVGFnLmV4ZWModGFyZ2V0KSl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKHRhcmdldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihzaW5nbGVDbGFzcy5leGVjKHRhcmdldCkpe1xuICAgICAgICAgICAgICAgIHJldHVybiBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKHRhcmdldC5zbGljZSgxKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCh0YXJnZXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICB9O1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzTGlzdChvYmplY3Qpe1xyXG4gICAgcmV0dXJuIG9iamVjdCAhPSBudWxsICYmIHR5cGVvZiBvYmplY3QgPT09ICdvYmplY3QnICYmICdsZW5ndGgnIGluIG9iamVjdCAmJiAhKCdub2RlVHlwZScgaW4gb2JqZWN0KSAmJiBvYmplY3Quc2VsZiAhPSBvYmplY3Q7IC8vIGluIElFOCwgd2luZG93LnNlbGYgaXMgd2luZG93LCBidXQgaXQgaXMgbm90ID09PSB3aW5kb3csIGJ1dCBpdCBpcyA9PSB3aW5kb3cuLi4uLi4uLi4gV1RGIT9cclxufSIsInZhciBjcmVsID0gcmVxdWlyZSgnY3JlbCcpLFxuICAgIGRvYyA9IHJlcXVpcmUoJ2RvYy1qcycpLFxuICAgIHNlc3Npb24gPSByZXF1aXJlKCcuLi8uLi9ndWVzdC5qcycpO1xuXG52YXIgaW5zdHJ1Y3Rpb25zID0gY3JlbCgnZGl2Jywge1xuICAgICAgICBjbGFzczogJ2luc3RydWN0aW9ucydcbiAgICB9LFxuICAgIGNyZWwoJ2gzJywgJ2Nyb3NzLWRvbWFpbi1zdG9yYWdlIGd1ZXN0Jylcbik7XG5cbmRvYy5yZWFkeShmdW5jdGlvbigpIHtcbiAgICBjcmVsKGRvY3VtZW50LmJvZHksXG4gICAgICAgIGluc3RydWN0aW9uc1xuICAgICk7XG5cbiAgICBzZXNzaW9uLmluaXQoJ2h0dHA6Ly9sb2NhbGhvc3Q6OTEyMycpO1xuXG4gICAgc2Vzc2lvbi5nZXQoJ2ZvbycsIGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zb2xlLmxvZygnZm9vOicsIGFyZ3VtZW50cyk7XG4gICAgfSk7XG5cbiAgICB3aW5kb3cuc2Vzc2lvbiA9IHNlc3Npb247XG5cbn0pO1xuIl19
