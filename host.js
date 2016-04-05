var getId = require('./getId');

module.exports = function(allowedDomains) {
    var storage = window.localStorage,
        methods = {
        get: function(event, data) {
            event.source.postMessage({
                id: data.id,
                data: storage.getItem(data.key)
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
