### try-parse-json

JSON.parse() wrapped in a try catch. Returns any error instead of throwing.

### Usage

```javascript
var tryParseJSON = require('try-parse-json');

tryParseJSON('{"a": 1, "b": 2}') // {a:1, b:2}
```

### Errors

```javascript
tryParseJSON('[1, 2, 3,]'),message // 'Unexpected token ]'
```
