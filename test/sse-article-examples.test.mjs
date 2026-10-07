import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { EventEmitter } from 'node:events';
import { createServer, request } from 'node:http';
import vm from 'node:vm';

// Exercise the actual published method bodies, rather than maintaining a second
// implementation. SDK adapters are local doubles: no model API or credentials.
const article = readFileSync(new URL('../knowledge/backend/api/sse-server.md', import.meta.url), 'utf8');
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
function method(name) {
  const body = article.match(new RegExp(`async ${name}[\\s\\S]*?\\) \\{([\\s\\S]*?)\\n  \\}`))?.[1];
  assert.ok(body, `published ${name} method must exist`);
  return new AsyncFunction('body', 'res', 'req', body);
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function aborted(signal) {
  return new Promise((_, reject) => {
    if (signal.aborted) reject(signal.reason);
    else signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  });
}
function delta(text) {
  return { type: 'content_block_delta', delta: { type: 'text_delta', text }, choices: [{ delta: { content: text } }] };
}
function sdkFor(factory, record) {
  const create = (params, options) => {
    record.calls++;
    record.signal = options?.signal;
    assert.ok(record.signal instanceof AbortSignal, 'cancellation must reach SDK request options');
    record.signal.addEventListener('abort', () => record.aborts++, { once: true });
    return factory(record.signal);
  };
  return { anthropic: { messages: { stream: create } }, openai: { chat: { completions: { create } } } };
}
function responseDouble() {
  const res = new EventEmitter();
  Object.assign(res, {
    destroyed: false, writableEnded: false, output: '', ends: 0, headers: 0,
    setHeader() { this.headers++; }, flushHeaders() {},
    write(text) { assert.equal(this.destroyed, false); assert.equal(this.writableEnded, false); this.output += text; return true; },
    end(text = '') { this.output += text; this.ends++; this.writableEnded = true; this.emit('finish'); this.emit('close'); },
    destroy() { this.destroyed = true; this.emit('close'); },
  });
  return res;
}
const newRecord = () => ({ calls: 0, aborts: 0, produced: 0 });

test('published EventSource error handler distinguishes retrying from terminal CLOSED', () => {
  const body = article.match(/evtSource\.addEventListener\('error',[\s\S]*?=> \{([\s\S]*?)\n\}\);/)?.[1];
  assert.ok(body);
  const warnings = [];
  const source = { readyState: 0 };
  const context = { evtSource: source, EventSource: { CONNECTING: 0, OPEN: 1, CLOSED: 2 }, console: { warn: text => warnings.push(text) } };
  vm.runInNewContext(body, context);
  assert.match(warnings.pop(), /尝试恢复/u);
  source.readyState = 2;
  vm.runInNewContext(body, context);
  assert.match(warnings.pop(), /不再自动重连/u);
  source.readyState = 1;
  vm.runInNewContext(body, context);
  assert.equal(warnings.length, 0);
});

for (const name of ['anthropicStream', 'openaiStream']) {
  const run = method(name);
  test(`${name}: early response disconnect aborts before a second delta`, async () => {
    const record = newRecord(), res = responseDouble();
    const sdk = sdkFor(signal => ({ async *[Symbol.asyncIterator]() {
      record.produced++; yield delta('A');
      assert.equal(res.listenerCount('close'), 1);
      res.destroy();
      if (signal.aborted) throw signal.reason;
      record.produced++; yield delta('B');
    } }), record);
    await run.call(sdk, { prompt: 'test' }, res, new EventEmitter());
    assert.equal(record.aborts, 1);
    assert.equal(record.produced, 1);
    assert.match(res.output, /"A"/u);
    assert.doesNotMatch(res.output, /"B"|event: done/u);
    assert.equal(res.ends, 0);
    assert.equal(res.listenerCount('close'), 0);
  });

  test(`${name}: disconnect while SDK connection is pending cancels and cleans up`, async () => {
    const record = newRecord(), res = responseDouble();
    const sdk = sdkFor(signal => aborted(signal), record);
    const pending = run.call(sdk, { prompt: 'test' }, res, new EventEmitter());
    assert.equal(record.calls, 1);
    assert.equal(res.listenerCount('close'), 1);
    res.destroy();
    await pending;
    assert.equal(record.aborts, 1);
    assert.equal(res.output, '');
    assert.equal(res.listenerCount('close'), 0);
  });

  test(`${name}: a late SDK result after disconnect is never consumed`, async () => {
    const record = newRecord(), res = responseDouble(), connection = deferred();
    const sdk = sdkFor(() => connection.promise, record);
    const pending = run.call(sdk, { prompt: 'test' }, res, new EventEmitter());
    res.destroy();
    connection.resolve({ async *[Symbol.asyncIterator]() { record.produced++; yield delta('late'); } });
    await pending;
    assert.equal(record.aborts, 1);
    assert.equal(record.produced, 0);
    assert.equal(res.output, '');
    assert.equal(res.listenerCount('close'), 0);
  });

  test(`${name}: normal completion sends one done and does not abort on end/close`, async () => {
    const record = newRecord(), res = responseDouble(), req = new EventEmitter();
    const sdk = sdkFor(() => ({ async *[Symbol.asyncIterator]() {
      yield delta('A'); req.emit('close'); yield delta('B');
    } }), record);
    await run.call(sdk, { prompt: 'test' }, res, req);
    assert.equal(record.aborts, 0, 'request-body completion and response end are not premature disconnects');
    assert.match(res.output, /"A"/u); assert.match(res.output, /"B"/u);
    assert.equal(res.output.match(/event: done/gu)?.length, 1);
    assert.equal(res.ends, 1);
    assert.equal(res.listenerCount('close'), 0);
    assert.equal(req.listenerCount('close'), 0);
    res.emit('close'); assert.equal(record.aborts, 0);
  });

  test(`${name}: an already closed response starts no SDK request`, async () => {
    const record = newRecord(), res = responseDouble(); res.destroyed = true;
    const sdk = sdkFor(() => { throw new Error('must not call SDK'); }, record);
    await run.call(sdk, { prompt: 'test' }, res, new EventEmitter());
    assert.equal(record.calls, 0); assert.equal(res.headers, 0);
    assert.equal(res.listenerCount('close'), 0);
  });

  test(`${name}: real upstream failure is propagated with no fake completion`, async () => {
    const record = newRecord(), res = responseDouble(), failure = new Error('local upstream failure');
    const sdk = sdkFor(() => ({ async *[Symbol.asyncIterator]() { throw failure; } }), record);
    await assert.rejects(run.call(sdk, { prompt: 'test' }, res, new EventEmitter()), error => error === failure);
    assert.equal(record.aborts, 1); assert.equal(res.destroyed, true);
    assert.equal(res.output, ''); assert.equal(res.listenerCount('close'), 0);
  });

  for (const earlyDisconnect of [true, false]) {
    test(`${name}: native HTTP ${earlyDisconnect ? 'early socket close cancels' : 'normal POST completion keeps streaming'}`, { timeout: 5000 }, async () => {
      const record = newRecord(), finished = deferred(), second = deferred();
      let serverResponse, bodyCloseAborted, clientRequest;
      const sdk = sdkFor(signal => ({ async *[Symbol.asyncIterator]() {
        record.produced++; yield delta('A');
        await Promise.race([second.promise, aborted(signal)]);
        record.produced++; yield delta('B');
      } }), record);
      const server = createServer((req, res) => {
        serverResponse = res;
        req.on('close', () => { bodyCloseAborted = record.signal?.aborted; });
        req.on('end', () => { run.call(sdk, { prompt: 'test' }, res, req).then(finished.resolve, finished.reject); });
        req.resume();
      });
      try {
        await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
        const received = await new Promise((resolve, reject) => {
          clientRequest = request({ hostname: '127.0.0.1', port: server.address().port, method: 'POST', agent: false }, res => {
            let text = '';
            res.on('data', bytes => {
              text += bytes.toString();
              if (text.includes('"A"')) {
                if (earlyDisconnect) res.destroy();
                else second.resolve();
              }
            });
            res.on('end', () => resolve(text));
            res.on('close', () => { if (earlyDisconnect) resolve(text); });
            res.on('error', error => { if (!earlyDisconnect) reject(error); });
          });
          clientRequest.on('error', reject);
          clientRequest.end('local POST body');
        });
        await finished.promise;
        assert.equal(bodyCloseAborted, false, 'IncomingMessage close must not cancel a still-open response');
        assert.equal(record.aborts, earlyDisconnect ? 1 : 0);
        assert.equal(record.produced, earlyDisconnect ? 1 : 2);
        assert.equal(serverResponse.listenerCount('close'), 0);
        assert.equal(received.includes('event: done'), !earlyDisconnect);
      } finally {
        clientRequest?.destroy();
        server.closeAllConnections();
        await new Promise(resolve => server.close(resolve));
      }
    });
  }
}
