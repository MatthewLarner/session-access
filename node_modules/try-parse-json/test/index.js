var test = require('tape'),
    tryParseJSON = require('../');

test('Stringified JSON', function(t){
    var input = '{"a": 1, "b": 2}',
    expectedOutput = {a:1, b:2};

    t.plan(1);
    t.deepEqual(tryParseJSON(input), expectedOutput);
});

test('Boolean', function(t){
    var input = 'true',
    expectedOutput = true;
    t.plan(1);
    t.equal(tryParseJSON(input), expectedOutput);
});

test('Array', function(t) {
    var input = '[1, 2, "c", false]',
    expectedOutput = [1, 2, "c", false];

    t.plan(1);
    t.deepEqual(tryParseJSON(input), expectedOutput);
});

test('null', function(t) {
    var input = 'null',
    expectedOutput = null;

    t.plan(1);
    t.deepEqual(tryParseJSON(input), expectedOutput);
});

test('object', function(t) {
    var input = '{}',
    expectedOutput = {};

    t.plan(1);
    t.deepEqual(tryParseJSON(input), expectedOutput);
});

test('reviver', function(t) {
    var input = '{"a": 10}',
    reviver = function (key, value) {
        if(key === "") return value;
        return value / 2;
    },
    expectedOutput = { a: 5 };

    t.plan(1);
    t.deepEqual(tryParseJSON(input, reviver), expectedOutput);
});

test('error', function(t) {
    var input = '[1, 2, 3,]';

    t.plan(2);
    t.ok(tryParseJSON(input) instanceof Error);
    t.deepEqual(tryParseJSON(input).message, 'Unexpected token ]');
});
