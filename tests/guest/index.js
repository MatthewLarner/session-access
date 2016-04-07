var crel = require('crel'),
    doc = require('doc-js'),
    createStorageGuest = require('../../guest.js');

var instructions = crel('div', {
        class: 'instructions'
    },
    crel('h3', 'cross-domain-storage guest')
);

doc.ready(function() {
    crel(document.body,
        instructions
    );

    var storageGuest = createStorageGuest('http://localhost:9123');

    storageGuest.get('foo', function() {
        console.log('foo:', arguments);
    });

    window.storageGuest = storageGuest;

});
