var getId = require('./getId'),
    parseJSON = require('try-parse-json');

function parseJSONValue(value){
    if(value == null) {
        return value;
    }

    var result = parseJSON(value);

    if(result instanceof Error) {
        result = null;
    }

    return result;
}

module.exports = function(allowedDomains) {
    var storage = window.localStorage,
        methods = {
        get: function(event, data) {
            event.source.postMessage({
                id: data.id,
                data: parseJSONValue(storage.getItem(data.key))
            }, event.origin);
        },
        set: function(event, data) {
            storage.setItem(data.key, data.value);

            event.source.postMessage({
                id: data.id
            }, event.origin);
        },
        remove: function(event, data) {
            storage.removeItem(data.key, data.value);

            event.source.postMessage({
                id: data.id
            }, event.origin);
        },
        connect: function(event) {
            event.source.postMessage({
                id: 'sessionAccessId-connected'
            }, event.origin);
        }
    };

    window.addEventListener('message', function(event) {
        var data = event.data,
            domainFound = allowedDomains.find(function(domain) {
                return event.origin === domain;
            });

        if(!domainFound || !getId(data)) {
            return;
        }

        methods[data.method](event, data);

    });
};
