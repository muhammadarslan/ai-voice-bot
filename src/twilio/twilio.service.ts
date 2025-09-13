import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';

@Injectable()
export class TwilioService {
  private client: twilio.Twilio;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    
    if (accountSid && authToken && accountSid.startsWith('AC') && authToken.length > 10) {
      this.client = twilio(accountSid, authToken);
    } else {
      console.warn('⚠️  Twilio credentials not configured. Voice bot will run in demo mode.');
    }
  }

  createTwiMLResponse(message: string, gatherOptions?: any, redirectUrl?: string): string {
    const response = new twilio.twiml.VoiceResponse();

    if (gatherOptions) {
      const gather = response.gather({
        input: gatherOptions.input || 'dtmf speech',
        timeout: gatherOptions.timeout || 5,
        numDigits: gatherOptions.numDigits || 1,
        action: gatherOptions.action,
        method: 'POST',
        speechTimeout: gatherOptions.speechTimeout || 'auto',
      });
      gather.say({ voice: 'alice', language: 'en-US' }, message);
    } else {
      response.say({ voice: 'alice', language: 'en-US' }, message);
    }

    if (redirectUrl) {
      response.redirect(redirectUrl);
    }

    return response.toString();
  }

  async makeCall(to: string, from: string, url: string): Promise<any> {
    if (!this.client) {
      throw new Error('Twilio client not initialized');
    }

    return await this.client.calls.create({
      to,
      from,
      url,
    });
  }

  async sendSMS(to: string, from: string, body: string): Promise<any> {
    if (!this.client) {
      throw new Error('Twilio client not initialized');
    }

    return await this.client.messages.create({
      to,
      from,
      body,
    });
  }
}
