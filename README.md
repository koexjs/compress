# koa-compress

[![NPM version](https://img.shields.io/npm/v/@zcorky/koa-compress.svg?style=flat)](https://www.npmjs.com/package/@zcorky/koa-compress)
[![Coverage Status](https://img.shields.io/coveralls/zcorky/koa-compress.svg?style=flat)](https://coveralls.io/r/zcorky/koa-compress)
[![Dependencies](https://david-dm.org/@zcorky/koa-compress/status.svg)](https://david-dm.org/@zcorky/koa-compress)
[![Build Status](https://travis-ci.com/zcorky/koa-compress.svg?branch=master)](https://travis-ci.com/zcorky/koa-compress)
![license](https://img.shields.io/github/license/zcorky/koa-compress.svg)
[![issues](https://img.shields.io/github/issues/zcorky/koa-compress.svg)](https://github.com/zcorky/koa-compress/issues)

> response time header for Koa.

### Install

```
$ npm install @zcorky/koa-compress
```

### Usage

```javascript
// See more in test
import compress from '@zcorky/koa-compress';

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