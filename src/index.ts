import * as zlib from 'zlib';
import * as Stream from 'stream';
import { Context, Middleware } from 'koa';
import * as _compressible from 'compressible';
import * as isJSON from 'koa-is-json';
import * as status from 'statuses';


export interface Options extends zlib.ZlibOptions {
  /**
   * An optional function that checks the response content type to decide whether to compress.
   * By default, it uses `_compressible`.
   */
  compressible?: (responseType: string) => boolean;
  
  /**
   * Minimum response size in bytes to compress. Default 1024(bytes= 1kb).
   */
  threshold?: number;
}

export type Encoding = 'gzip' | 'deflate' | 'identity';

const encodingMethods = {
  gzip: zlib.createGzip,
  deflate: zlib.createDeflate,
};

/**
 * Add X-Response-Time header field.
 */
export default (options?: Options): Middleware => {
  const { compressible = _compressible, threshold = 1024 } = options || {} as Options;

  return async function compress(ctx: Context, next: () => Promise<void>) {
    ctx.vary('Accept-Encoding');

    await next();

    let { body } = ctx;

    // empty body
    if (!body) return ;

    // response already sent
    if (ctx.res.headersSent || !ctx.writable) return ;

    // explicit statement no compress on context with compress = false
    if (ctx.compress === false) return ;

    // request method: HEAD, no response
    if (ctx.method === 'HEAD') return ;

    // status: 204, 205, 304 => empty body
    if (status.empty[ctx.response.status]) return ;

    // get Content-Encoding means other middlewares already compress body
    if (ctx.response.get('Content-Encoding')) return ;

    // force compression or imply
    if (!(ctx.compress === true || compressible(ctx.response.type))) return ;

    const encoding = ctx.acceptsEncodings('gzip', 'deflate', 'identity') as Encoding;
    if (!encoding) ctx.throw(406, 'supported encodings: gzip, delate, identity');
    if (encoding === 'identity') return ;

    // json
    if (isJSON(body)) body = ctx.body = JSON.stringify(body);

    // threshold
    if (ctx.response.length < threshold) return ;

    ctx.set('Content-Encoding', encoding as string);
    ctx.remove('Content-Length');

    const stream = ctx.body = encodingMethods[encoding as 'gzip' | 'deflate'](options);

    if (body instanceof Stream) {
      body.pipe(stream);
    } else {
      stream.end(body);
    }
  };
};
