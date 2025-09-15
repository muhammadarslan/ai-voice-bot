import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { CallSession, CallState } from '../common/interfaces/call-session.interface';

@Injectable()
export class SessionService {
  private memoryFallback: Map<string, CallSession> = new Map();

  constructor(private redisService: RedisService) {}

  async getSession(callSid: string): Promise<CallSession> {
    try {
      // Try Redis first
      const session = await this.redisService.getSession(callSid);
      if (session) {
        return session;
      }
    } catch (error) {
      console.warn('Redis unavailable, using memory fallback:', error.message);
    }

    // Fallback to memory or create new session
    if (this.memoryFallback.has(callSid)) {
      return this.memoryFallback.get(callSid);
    }

    // Create new session
    const newSession: CallSession = {
      callSid,
      state: CallState.GREETING,
      retryCount: 0,
      bookingData: {},
      language: 'english',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.setSession(callSid, newSession);
    return newSession;
  }

  async setSession(callSid: string, session: CallSession): Promise<void> {
    session.updatedAt = new Date();

    try {
      // Try Redis first
      await this.redisService.setSession(callSid, session, 3600); // 1 hour TTL
    } catch (error) {
      console.warn('Redis unavailable, using memory fallback:', error.message);
      // Fallback to memory
      this.memoryFallback.set(callSid, session);
    }
  }

  async updateSession(callSid: string, updates: Partial<CallSession>): Promise<CallSession> {
    const session = await this.getSession(callSid);
    const updatedSession = { ...session, ...updates, updatedAt: new Date() };
    await this.setSession(callSid, updatedSession);
    return updatedSession;
  }

  async deleteSession(callSid: string): Promise<void> {
    try {
      await this.redisService.deleteSession(callSid);
    } catch (error) {
      console.warn('Redis unavailable for deletion:', error.message);
    }
    
    // Always clean up memory fallback
    this.memoryFallback.delete(callSid);
  }

  async extendSession(callSid: string, ttlSeconds: number = 3600): Promise<void> {
    try {
      await this.redisService.extendSession(callSid, ttlSeconds);
    } catch (error) {
      console.warn('Redis unavailable for session extension:', error.message);
      // Memory sessions don't need explicit extension
    }
  }

  async getActiveSessionCount(): Promise<number> {
    try {
      return await this.redisService.getSessionCount();
    } catch (error) {
      return this.memoryFallback.size;
    }
  }

  async getAllActiveSessions(): Promise<string[]> {
    try {
      return await this.redisService.getAllActiveSessions();
    } catch (error) {
      return Array.from(this.memoryFallback.keys());
    }
  }

  async isRedisHealthy(): Promise<boolean> {
    try {
      return await this.redisService.isHealthy();
    } catch (error) {
      return false;
    }
  }

  // Cleanup expired memory sessions (fallback mechanism)
  cleanupExpiredMemorySessions(maxAgeMinutes: number = 60): void {
    const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
    
    for (const [callSid, session] of this.memoryFallback.entries()) {
      if (session.updatedAt < cutoffTime) {
        this.memoryFallback.delete(callSid);
      }
    }
  }
}
