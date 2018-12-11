# compress

[![NPM version](https://img.shields.io/npm/v/@koex/compress.svg?style=flat)](https://www.npmjs.com/package/@koex/compress)
[![Coverage Status](https://img.shields.io/coveralls/koexjs/compress.svg?style=flat)](https://coveralls.io/r/koexjs/compress)
[![Dependencies](https://img.shields.io/david/koexjs/compress.svg)](https://github.com/koexjs/compress)
[![Build Status](https://travis-ci.com/koexjs/compress.svg?branch=master)](https://travis-ci.com/koexjs/compress)
![license](https://img.shields.io/github/license/koexjs/compress.svg)
[![issues](https://img.shields.io/github/issues/koexjs/compress.svg)](https://github.com/koexjs/compress/issues)

> compress for koa extend.

### Install

```
$ npm install @koex/compress
```

### Usage

```javascript
// See more in test
import compress from '@koex/compress';

import * as Koa from 'koa';
const app = new Koa();

app.use(compress());

app.use(ctx => {
  ctx.body = 'hello, world!';
});

app.listen(8000, '0.0.0.0', () => {
  console.log('koa server start at port: 8000');
});
```

### Related
* [koa-compress](https://github.com/koajs/compress)