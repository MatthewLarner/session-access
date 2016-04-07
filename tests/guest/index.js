var crel = require('crel'),
    doc = require('doc-js'),
    createStorageGuest = require('../../guest');

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

    storageGuest.get('foo', function(error, data) {
        console.log('foo:', arguments);
    });

    storageGuest.set('foo', 'cabbage', function(error, data) {
        // probably set...
    });
});
