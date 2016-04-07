var crel = require('crel'),
    doc = require('doc-js'),
    storageHost = require('../../host');

var instructions = crel('div', {
        class: 'instructions'
    },
    crel('h3', 'cross-domain-storage host')
);

doc.ready(function() {
    crel(document.body,
        instructions
    );

    window.localStorage.setItem('foo', JSON.stringify('bar'));

    storageHost([
        {
            origin: 'http://localhost:9124',
            allowedMethods: ['get', 'set', 'remove']
        }
    ]);

    console.log(storageHost);
debugger

    // sessionHost.close();

});
