import * as path from 'path';
import * as crypto from 'crypto';
import * as fs from 'fs';
// import * as zlib from 'zlib';
import * as Koa from 'koa';
import * as request from 'supertest';
import 'should';

import compress from '../src';

describe('koa-compress', () => {
  const buffer = crypto.randomBytes(1024);
  const str = buffer.toString('hex');

  function sendString(ctx, next) {
    ctx.body = str;
  }

  function sendBuffer(ctx, next) {
    ctx.compress = true;
    ctx.body = buffer;
  }

  it('should compress strings', (done) => {
    const app = new Koa();

    app.use(compress());
    app.use(sendString);

    request(app.listen())
      .get('/')
      .expect('vary', 'Accept-Encoding')
      .expect('content-encoding', 'gzip')
      .expect('content-type', 'text/plain; charset=utf-8')
      .expect(200, str)
      .end((err, res) => {
        if (err) return done(err);

        res.headers['transfer-encoding'].should.be.equals('chunked');
        res.headers.should.not.have.property('content-length');
        done();
      });
  });

  it('should not compress string below threshold', (done) => {
    const app = new Koa();

    app.use(compress({
      threshold: str.length + 1,
    }));
    app.use(sendString);

    request(app.listen())
      .get('/')
      .expect('vary', 'Accept-Encoding')
      .expect('content-type', 'text/plain; charset=utf-8')
      .expect('content-length', `${str.length}`)
      .expect(200, str)
      .end((err, res) => {
        if (err) return done(err);

        res.headers.should.not.have.property('content-encoding');
        res.headers.should.not.have.property('transfer-encoding');
        done();
      });
  });

  it('should compress JSON body', (done) => {
    const app = new Koa();
    const jsonBody = { status: 200, message: 'ok', data: str };

    app.use(compress());
    app.use(ctx => {
      ctx.body = jsonBody;
    });

    request(app.listen())
      .get('/')
      .expect('vary', 'Accept-Encoding')
      .expect('content-encoding', 'gzip')
      .expect('content-type', 'application/json; charset=utf-8')
      .expect(200, JSON.stringify(jsonBody))
      .end((err, res) => {
        if (err) return done(err);

        res.headers['transfer-encoding'].should.be.equals('chunked');
        res.headers.should.not.have.property('content-length');
        done();
      });
  });

  it('should not compress json below threshold', (done) => {
    const app = new Koa();
    const jsonBody = { status: 200, message: 'ok' };

    app.use(compress());
    app.use(ctx => {
      ctx.body = jsonBody;
    });

    request(app.listen())
      .get('/')
      .expect('vary', 'Accept-Encoding')
      .expect('content-type', 'application/json; charset=utf-8')
      .expect('content-length', `${JSON.stringify(jsonBody).length}`)
      .expect(200, JSON.stringify(jsonBody))
      .end((err, res) => {
        if (err) return done(err);

        res.headers.should.not.have.property('content-encoding');
        res.headers.should.not.have.property('transfer-encoding');
        done();
      });
  });

  it('should compress buffers', (done) => {
    const app = new Koa();

    app.use(compress());
    app.use(sendBuffer);

    request(app.listen())
      .get('/')
      .expect('vary', 'Accept-Encoding')
      .expect('content-encoding', 'gzip')
      .expect('content-type', 'application/octet-stream')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.headers['transfer-encoding'].should.be.equals('chunked');
        res.headers.should.not.have.property('content-length');
        done();
      });
  });

  it('should compress stream', (done) => {
    const app = new Koa();

    app.use(compress());
    app.use(ctx => {
      ctx.type = 'application/javascript';
      ctx.body = fs.createReadStream(path.join(__dirname, 'index.spec.ts'));
    });

    request(app.listen())
      .get('/')
      .expect('vary', 'Accept-Encoding')
      .expect('content-encoding', 'gzip')
      .expect('content-type', 'application/javascript; charset=utf-8')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.headers['transfer-encoding'].should.be.equals('chunked');
        res.headers.should.not.have.property('content-length');
        done();
      });
  });

  it('should not compress when ctx.compress = false', (done) => {
    const app = new Koa();
    const jsonBody = { status: 200, message: 'ok', data: str };

    app.use(compress());
    app.use(ctx => {
      ctx.compress = false;
      ctx.body = jsonBody;
    });

    request(app.listen())
      .get('/')
      .expect('vary', 'Accept-Encoding')
      .expect('content-type', 'application/json; charset=utf-8')
      .expect('content-length', `${JSON.stringify(jsonBody).length}`)
      .expect(200, JSON.stringify(jsonBody))
      .end((err, res) => {
        if (err) return done(err);

        res.headers.should.not.have.property('content-encoding');
        res.headers.should.not.have.property('transfer-encoding');
        done();
      });
  });

  it('should not compress when ctx.method = HEAD', (done) => {
    const app = new Koa();
    const jsonBody = { status: 200, message: 'ok', data: str };

    app.use(compress());
    app.use(ctx => {
      ctx.body = jsonBody;
    });

    request(app.listen())
      .head('/')
      .expect('vary', 'Accept-Encoding')
      .expect('content-type', 'application/json; charset=utf-8')
      .expect('content-length', `${JSON.stringify(jsonBody).length}`)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.headers.should.not.have.property('content-encoding');
        res.headers.should.not.have.property('transfer-encoding');
        done();
      });
  });

  it('should not compress when ctx.response.status is 204, 205, 304', (done) => {
    const app = new Koa();
    const jsonBody = { status: 200, message: 'ok', data: str };

    app.use(compress());
    app.use(ctx => {
      ctx.status = 204; // ignore body
      ctx.body = jsonBody;
    });

    request(app.listen())
      .get('/')
      .expect('vary', 'Accept-Encoding')
      .expect(204)
      .end((err, res) => {
        if (err) return done(err);

        res.headers.should.not.have.property('content-encoding');
        res.headers.should.not.have.property('transfer-encoding');
        done();
      });
  });

  it('should not compress when already set Content-Encoding, that is, already compress', (done) => {
    const app = new Koa();
    const jsonBody = { status: 200, message: 'ok', data: str };

    app.use(compress());
    app.use(ctx => {
      ctx.set('Content-Encoding', 'none');
      ctx.body = jsonBody;
    });

    request(app.listen())
      .get('/')
      .expect('vary', 'Accept-Encoding')
      .expect('content-encoding', 'none')
      .expect('content-type', 'application/json; charset=utf-8')
      .expect('content-length', `${JSON.stringify(jsonBody).length}`)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.headers.should.not.have.property('transfer-encoding');
        done();
      });
  });

  it('should not compress when compressible() = false', (done) => {
    const app = new Koa();
    const jsonBody = { status: 200, message: 'ok', data: str };

    app.use(compress({
      compressible: () => false,
    }));
    app.use(ctx => {
      ctx.body = jsonBody;
    });

    request(app.listen())
      .get('/')
      .expect('vary', 'Accept-Encoding')
      .expect('content-type', 'application/json; charset=utf-8')
      .expect('content-length', `${JSON.stringify(jsonBody).length}`)
      .expect(200, JSON.stringify(jsonBody))
      .end((err, res) => {
        if (err) return done(err);

        res.headers.should.not.have.property('content-encoding');
        res.headers.should.not.have.property('transfer-encoding');
        done();
      });
  });

  it('should compress with deflate when set header Accept-Encoding: deflate', (done) => {
    const app = new Koa();
    const jsonBody = { status: 200, message: 'ok', data: str };

    app.use(compress());
    app.use(ctx => {
      ctx.body = jsonBody;
    });

    request(app.listen())
      .get('/')
      .set('accept-encoding', 'deflate')
      .expect('vary', 'Accept-Encoding')
      .expect('content-encoding', 'deflate')
      .expect('transfer-encoding', 'chunked')
      .expect('content-type', 'application/json; charset=utf-8')
      .expect(200, JSON.stringify(jsonBody))
      .end((err, res) => {
        if (err) return done(err);

        res.headers.should.not.have.property('content-length');
        done();
      });
  });

  it('should not compress when when set header Accept-Encoding: identity', (done) => {
    const app = new Koa();
    const jsonBody = { status: 200, message: 'ok', data: str };

    app.use(compress());
    app.use(ctx => {
      ctx.body = jsonBody;
    });

    request(app.listen())
      .get('/')
      .set('accept-encoding', 'identity')
      .expect('vary', 'Accept-Encoding')
      .expect('content-type', 'application/json; charset=utf-8')
      .expect('content-length', `${JSON.stringify(jsonBody).length}`)
      .expect(200, JSON.stringify(jsonBody))
      .end((err, res) => {
        if (err) return done(err);

        res.headers.should.not.have.property('content-encoding');
        res.headers.should.not.have.property('transfer-encoding');
        done();
      });
  });

  it('should not compress when set header Accept-Encoding: br', (done) => {
    const app = new Koa();
    const jsonBody = { status: 200, message: 'ok', data: str };

    app.use(compress());
    app.use(ctx => {
      ctx.body = jsonBody;
    });

    request(app.listen())
      .get('/')
      .set('accept-encoding', 'br')
      .expect('vary', 'Accept-Encoding')
      .expect('content-type', 'application/json; charset=utf-8')
      .expect('content-length', `${JSON.stringify(jsonBody).length}`)
      .expect(200, JSON.stringify(jsonBody))
      .end((err, res) => {
        if (err) return done(err);

        res.headers.should.not.have.property('content-encoding');
        res.headers.should.not.have.property('transfer-encoding');
        done();
      });
  });

  it('should not compress when set header Accept-Encoding: unknown', (done) => {
    const app = new Koa();
    const jsonBody = { status: 200, message: 'ok', data: str };

    app.use(compress());
    app.use(ctx => {
      ctx.body = jsonBody;
    });

    request(app.listen())
      .get('/')
      .set('accept-encoding', 'unknown')
      .expect('vary', 'Accept-Encoding')
      .expect('content-type', 'application/json; charset=utf-8')
      .expect('content-length', `${JSON.stringify(jsonBody).length}`)
      .expect(200, JSON.stringify(jsonBody))
      .end((err, res) => {
        if (err) return done(err);

        res.headers.should.not.have.property('content-encoding');
        res.headers.should.not.have.property('transfer-encoding');
        done();
      });
  });

  it('should not compress when body is empty', (done) => {
    const app = new Koa();

    app.use(compress());
    app.use(ctx => {
      ctx.body = null;
    });

    request(app.listen())
      .get('/')
      .set('accept-encoding', 'unknown')
      .expect('vary', 'Accept-Encoding')
      .expect(204)
      .end((err, res) => {
        if (err) return done(err);

        res.headers.should.not.have.property('content-encoding');
        res.headers.should.not.have.property('transfer-encoding');
        done();
      });
  });
});
