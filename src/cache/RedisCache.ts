// File: src/cache/RedisCache.ts

import { createClient, RedisClientType } from 'redis';

export class RedisCache {
  private client: RedisClientType;

  constructor() {
    this.client = createClient();
    this.client.on('error', (err) => console.log('Redis Client Error', err));
  }

  async connect() {
    await this.client.connect();
  }

  async set(key: string, value: string, ttl?: number) {
    await this.client.set(key, value);
    if (ttl) {
      await this.client.expire(key, ttl);
    }
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async close() {
    await this.client.quit();
  }
}