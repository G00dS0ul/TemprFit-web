import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

const TEST_URI = 'mongodb://connector.invalid/test';
let importCount = 0;

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

describe('Database connection caching and failure recovery', { concurrency: false }, () => {
  let originalUri;
  let hadUri;
  let originalCache;
  let cache;
  let attempts;
  let waiters;
  let connectMock;

  async function loadConnector() {
    const url = new URL('../../lib/db.js', import.meta.url);
    url.searchParams.set('testImport', String(++importCount));
    return import(url.href);
  }

  function start(connectDB) {
    const waiter = connectDB();
    waiter.catch(() => {});
    waiters.push(waiter);
    return waiter;
  }

  beforeEach(() => {
    hadUri = Object.hasOwn(process.env, 'MONGODB_URI');
    originalUri = process.env.MONGODB_URI;
    originalCache = Object.getOwnPropertyDescriptor(globalThis, '_mongoose');
    process.env.MONGODB_URI = TEST_URI;
    cache = { conn: null, promise: null };
    globalThis._mongoose = cache;
    attempts = [];
    waiters = [];
    connectMock = mock.method(mongoose, 'connect', (uri, options) => {
      assert.equal(uri, TEST_URI);
      assert.deepEqual(options, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
      });
      const attempt = deferred();
      attempts.push(attempt);
      return attempt.promise;
    });
  });

  afterEach(async () => {
    try {
      for (const attempt of attempts) attempt.resolve({ connection: 'cleanup' });
      await Promise.allSettled(waiters);
    } finally {
      mock.restoreAll();
      if (hadUri) process.env.MONGODB_URI = originalUri;
      else delete process.env.MONGODB_URI;
      if (originalCache) {
        Object.defineProperty(globalThis, '_mongoose', originalCache);
      } else {
        delete globalThis._mongoose;
      }
    }
  });

  it('rethrows the original failure and lets a later request connect successfully', async () => {
    const { connectDB } = await loadConnector();
    const error = new Error('Initial connection failed');
    const first = start(connectDB);
    const rejected = assert.rejects(first, (actual) => actual === error);
    attempts[0].reject(error);
    await rejected;

    assert.equal(connectMock.mock.callCount(), 1);
    assert.equal(cache.conn, null);
    assert.equal(cache.promise, null);

    const connection = { connection: 'recovered' };
    const retry = start(connectDB);
    assert.equal(connectMock.mock.callCount(), 2);
    attempts[1].resolve(connection);
    assert.equal(await retry, connection);
    assert.equal(cache.conn, connection);
  });

  it('coalesces concurrent callers into one pending successful attempt', async () => {
    const { connectDB } = await loadConnector();
    const first = start(connectDB);
    const pending = cache.promise;
    const others = [start(connectDB), start(connectDB)];

    assert.equal(connectMock.mock.callCount(), 1);
    assert.equal(cache.promise, pending);
    assert.equal(cache.conn, null);

    const connection = { connection: 'shared' };
    attempts[0].resolve(connection);
    const results = await Promise.all([first, ...others]);
    for (const result of results) assert.equal(result, connection);
    assert.equal(cache.conn, connection);
    assert.equal(cache.promise, pending);
  });

  it('shares a failure without automatic retries and coalesces a later retry', async () => {
    const { connectDB } = await loadConnector();
    const callers = [start(connectDB), start(connectDB), start(connectDB)];
    const pending = cache.promise;
    const error = new Error('Shared connection failed');
    const rejected = callers.map((caller) => assert.rejects(caller, (actual) => actual === error));

    assert.equal(connectMock.mock.callCount(), 1);
    assert.equal(cache.promise, pending);
    attempts[0].reject(error);
    await Promise.all(rejected);
    assert.equal(connectMock.mock.callCount(), 1);
    assert.equal(cache.conn, null);
    assert.equal(cache.promise, null);

    const retries = [start(connectDB), start(connectDB), start(connectDB)];
    assert.equal(connectMock.mock.callCount(), 2);
    assert.notEqual(cache.promise, pending);
    const connection = { connection: 'shared-retry' };
    attempts[1].resolve(connection);
    for (const result of await Promise.all(retries)) assert.equal(result, connection);
    assert.equal(cache.conn, connection);
  });

  it('does not clear a newer successful connection when an older attempt rejects', async () => {
    const { connectDB } = await loadConnector();
    const older = start(connectDB);
    const oldPromise = cache.promise;

    // Stage replacement state to exercise rejection ownership defensively.
    cache.promise = null;
    const newer = start(connectDB);
    const newPromise = cache.promise;
    assert.notEqual(newPromise, oldPromise);
    const connection = { connection: 'newer-success' };
    attempts[1].resolve(connection);
    assert.equal(await newer, connection);

    const error = new Error('Older attempt failed');
    const rejected = assert.rejects(older, (actual) => actual === error);
    attempts[0].reject(error);
    await rejected;

    assert.equal(cache.conn, connection);
    assert.equal(cache.promise, newPromise);
    assert.equal(await start(connectDB), connection);
    assert.equal(connectMock.mock.callCount(), 2);
  });

  it('preserves a newer pending attempt when an older attempt rejects', async () => {
    const { connectDB } = await loadConnector();
    const older = start(connectDB);

    // Stage replacement state to exercise rejection ownership defensively.
    cache.promise = null;
    const newer = start(connectDB);
    const newPromise = cache.promise;
    const error = new Error('Superseded attempt failed');
    const rejected = assert.rejects(older, (actual) => actual === error);
    attempts[0].reject(error);
    await rejected;

    assert.equal(cache.conn, null);
    assert.equal(cache.promise, newPromise);
    const joined = start(connectDB);
    assert.equal(connectMock.mock.callCount(), 2);
    assert.equal(cache.promise, newPromise);
    const connection = { connection: 'newer-pending' };
    attempts[1].resolve(connection);
    assert.equal(await newer, connection);
    assert.equal(await joined, connection);
    assert.equal(cache.conn, connection);
  });

  it('reuses a successful connection across warm calls and module evaluations', async () => {
    const { connectDB } = await loadConnector();
    const first = start(connectDB);
    const pending = cache.promise;
    const connection = { connection: 'warm' };
    attempts[0].resolve(connection);
    assert.equal(await first, connection);
    assert.equal(await start(connectDB), connection);
    assert.equal(await start(connectDB), connection);

    const reloaded = await loadConnector();
    assert.equal(await start(reloaded.connectDB), connection);
    assert.equal(globalThis._mongoose, cache);
    assert.equal(cache.conn, connection);
    assert.equal(cache.promise, pending);
    assert.equal(connectMock.mock.callCount(), 1);
  });

  it('returns null repeatedly without connecting when the URI is absent', async () => {
    delete process.env.MONGODB_URI;
    const warning = mock.method(console, 'warn', () => {});
    const { connectDB } = await loadConnector();

    assert.equal(await start(connectDB), null);
    assert.equal(await start(connectDB), null);
    assert.equal(connectMock.mock.callCount(), 0);
    assert.equal(warning.mock.callCount(), 1);
    assert.equal(cache.conn, null);
    assert.equal(cache.promise, null);
  });

  it('returns null repeatedly without connecting when the URI is empty', async () => {
    process.env.MONGODB_URI = '';
    const warning = mock.method(console, 'warn', () => {});
    const { connectDB } = await loadConnector();

    assert.equal(await start(connectDB), null);
    assert.equal(await start(connectDB), null);
    assert.equal(connectMock.mock.callCount(), 0);
    assert.equal(warning.mock.callCount(), 1);
    assert.equal(cache.conn, null);
    assert.equal(cache.promise, null);
  });

  it('prioritizes an existing cached connection even when the URI is absent', async () => {
    delete process.env.MONGODB_URI;
    mock.method(console, 'warn', () => {});
    const connection = { connection: 'preexisting' };
    cache.conn = connection;
    const { connectDB } = await loadConnector();

    assert.equal(await start(connectDB), connection);
    assert.equal(await start(connectDB), connection);
    assert.equal(cache.conn, connection);
    assert.equal(cache.promise, null);
    assert.equal(connectMock.mock.callCount(), 0);
  });
});
