import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/voice-bot/webhook (POST)', () => {
    return request(app.getHttpServer())
      .post('/voice-bot/webhook')
      .send({ CallSid: 'test-call-123' })
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain('<Response>');
        expect(res.text).toContain('Welcome to');
      });
  });

  it('/voice-bot/menu-choice (POST)', () => {
    return request(app.getHttpServer())
      .post('/voice-bot/menu-choice')
      .send({ CallSid: 'test-call-123', Digits: '1' })
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain('<Response>');
        expect(res.text).toContain('appointment');
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
