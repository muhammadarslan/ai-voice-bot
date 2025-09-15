import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { CallSession } from '../common/interfaces/call-session.interface';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    const redisHost = this.configService.get<string>('REDIS_HOST', 'localhost');
    const redisPort = this.configService.get<number>('REDIS_PORT', 6379);
    const redisPassword = this.configService.get<string>('REDIS_PASSWORD');

    if (redisUrl) {
      this.client = new Redis(redisUrl);
    } else {
      this.client = new Redis({
        host: redisHost,
        port: redisPort,
        password: redisPassword,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        enableOfflineQueue: false,
        connectTimeout: 10000,
        commandTimeout: 5000,
      });
    }

    try {
      await this.client.connect();
      console.log('✅ Redis connected successfully');
    } catch (error) {
      console.warn('⚠️ Redis connection failed, falling back to memory storage:', error.message);
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.disconnect();
    }
  }

  async setSession(callSid: string, session: CallSession, ttlSeconds: number = 3600): Promise<void> {
    if (!this.client || this.client.status !== 'ready') {
      throw new Error('Redis client not available');
    }

    const key = `session:${callSid}`;
    const value = JSON.stringify(session);
    await this.client.setex(key, ttlSeconds, value);
  }

  async getSession(callSid: string): Promise<CallSession | null> {
    if (!this.client || this.client.status !== 'ready') {
      throw new Error('Redis client not available');
    }

    const key = `session:${callSid}`;
    const value = await this.client.get(key);
    
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as CallSession;
    } catch (error) {
      console.error('Error parsing session data:', error);
      return null;
    }
  }

  async deleteSession(callSid: string): Promise<void> {
    if (!this.client || this.client.status !== 'ready') {
      throw new Error('Redis client not available');
    }

    const key = `session:${callSid}`;
    await this.client.del(key);
  }

  async extendSession(callSid: string, ttlSeconds: number = 3600): Promise<void> {
    if (!this.client || this.client.status !== 'ready') {
      throw new Error('Redis client not available');
    }

    const key = `session:${callSid}`;
    await this.client.expire(key, ttlSeconds);
  }

  async getAllActiveSessions(): Promise<string[]> {
    if (!this.client || this.client.status !== 'ready') {
      throw new Error('Redis client not available');
    }

    const keys = await this.client.keys('session:*');
    return keys.map(key => key.replace('session:', ''));
  }

  async getSessionCount(): Promise<number> {
    if (!this.client || this.client.status !== 'ready') {
      throw new Error('Redis client not available');
    }

    const keys = await this.client.keys('session:*');
    return keys.length;
  }

  async isHealthy(): Promise<boolean> {
    try {
      if (!this.client || this.client.status !== 'ready') {
        return false;
      }
      
      await this.client.ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Utility methods for other Redis operations
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client || this.client.status !== 'ready') {
      throw new Error('Redis client not available');
    }

    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client || this.client.status !== 'ready') {
      throw new Error('Redis client not available');
    }

    return await this.client.get(key);
  }

  async del(key: string): Promise<void> {
    if (!this.client || this.client.status !== 'ready') {
      throw new Error('Redis client not available');
    }

    await this.client.del(key);
  }
}
