import 'server-only';

import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from 'node:crypto';
import Redis from 'ioredis';

import { authEnvironment } from './env';
import type { TokenPair } from './cookies';

const LOCK_TTL_MS = 18_000;
const RESULT_TTL_SECONDS = 20;
const WAIT_LIMIT_MS = 18_500;
const POLL_MS = 75;
const CLAIM_REFRESH_SCRIPT = `
local result = redis.call('get', KEYS[2])
if result then
  return 'RESULT:' .. result
end
local acquired = redis.call('set', KEYS[1], ARGV[1], 'PX', ARGV[2], 'NX')
if acquired then
  return 'ACQUIRED'
end
return 'WAIT'
`;
const inFlight = new Map<string, Promise<TokenPair | undefined>>();
let redis: Redis | undefined;

function redisClient(): Redis | undefined {
  const url = authEnvironment().redisUrl;
  if (!url) return undefined;
  redis ??= new Redis(url, {
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    connectTimeout: 2_000,
    commandTimeout: 2_500,
  });
  return redis;
}

function digest(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function validStoredPair(value: unknown): TokenPair | undefined {
  if (!isRecord(value)) return undefined;
  const record = value;
  return typeof record.accessToken === 'string' &&
    typeof record.refreshToken === 'string' &&
    typeof record.expiresIn === 'number' &&
    Number.isSafeInteger(record.expiresIn) &&
    record.expiresIn > 0
    ? { accessToken: record.accessToken, refreshToken: record.refreshToken, expiresIn: record.expiresIn }
    : undefined;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function resultEncryptionKey(): Buffer {
  return createHash('sha256').update(authEnvironment().csrfSecret).digest();
}

function encryptResult(result: TokenPair): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', resultEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(result), 'utf8'), cipher.final()]);
  return `v1.${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${ciphertext.toString('base64url')}`;
}

function decryptResult(stored: string): TokenPair | undefined {
  const [version, encodedIv, encodedTag, encodedCiphertext, extra] = stored.split('.');
  if (version !== 'v1' || !encodedIv || !encodedTag || !encodedCiphertext || extra) return undefined;
  try {
    const decipher = createDecipheriv('aes-256-gcm', resultEncryptionKey(), Buffer.from(encodedIv, 'base64url'));
    decipher.setAuthTag(Buffer.from(encodedTag, 'base64url'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(encodedCiphertext, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
    return validStoredPair(JSON.parse(plaintext));
  } catch {
    return undefined;
  }
}

async function wait(milliseconds: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

function storedResult(decision: unknown): TokenPair | undefined {
  if (typeof decision !== 'string' || !decision.startsWith('RESULT:')) return undefined;
  const stored = decision.slice('RESULT:'.length);
  return stored === 'null' ? undefined : decryptResult(stored);
}

export async function runDistributedRefresh(
  client: Redis | undefined,
  key: string,
  operation: () => Promise<TokenPair | undefined>,
): Promise<TokenPair | undefined> {
  if (!client) return operation();
  if (client.status === 'wait') await client.connect();
  const lockKey = `bff:refresh:lock:${key}`;
  const resultKey = `bff:refresh:result:${key}`;
  const owner = randomUUID();
  const decision = await client.eval(CLAIM_REFRESH_SCRIPT, 2, lockKey, resultKey, owner, String(LOCK_TTL_MS));
  if (typeof decision === 'string' && decision.startsWith('RESULT:')) return storedResult(decision);
  if (decision === 'ACQUIRED') {
    try {
      const result = await operation();
      await client.set(resultKey, result ? encryptResult(result) : 'null', 'EX', RESULT_TTL_SECONDS);
      return result;
    } finally {
      await client.eval(
        "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
        1,
        lockKey,
        owner,
      );
    }
  }
  if (decision !== 'WAIT') throw new Error('Unexpected Redis refresh lock decision');

  const deadline = Date.now() + WAIT_LIMIT_MS;
  while (Date.now() < deadline) {
    const stored = await client.get(resultKey);
    if (stored) {
      if (stored === 'null') return undefined;
      return decryptResult(stored);
    }
    await wait(POLL_MS);
  }
  return undefined;
}

export async function withRefreshLock(
  refreshToken: string,
  operation: () => Promise<TokenPair | undefined>,
): Promise<TokenPair | undefined> {
  const key = digest(refreshToken);
  const current = inFlight.get(key);
  if (current) return current;
  const pending = runDistributedRefresh(redisClient(), key, operation).finally(() => inFlight.delete(key));
  inFlight.set(key, pending);
  return pending;
}
