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
