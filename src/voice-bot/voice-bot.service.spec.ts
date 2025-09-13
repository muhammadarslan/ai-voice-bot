import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { VoiceBotService } from './voice-bot.service';
import { TwilioService } from '../twilio/twilio.service';
import { BookingService } from '../booking/booking.service';
import { CallState, MenuOption } from '../common/interfaces/call-session.interface';

describe('VoiceBotService', () => {
  let service: VoiceBotService;
  let twilioService: TwilioService;
  let bookingService: BookingService;
  let configService: ConfigService;

  const mockTwilioService = {
    createTwiMLResponse: jest.fn().mockReturnValue('<Response></Response>'),
  };

  const mockBookingService = {
    createBooking: jest.fn(),
    findBookingById: jest.fn(),
    findBookingsByPhone: jest.fn(),
    findBookingsByName: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config = {
        COMPANY_NAME: 'Test Company',
        OPENAI_API_KEY: 'test-key',
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VoiceBotService,
        { provide: TwilioService, useValue: mockTwilioService },
        { provide: BookingService, useValue: mockBookingService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<VoiceBotService>(VoiceBotService);
    twilioService = module.get<TwilioService>(TwilioService);
    bookingService = module.get<BookingService>(BookingService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleGreeting', () => {
    it('should return greeting message with menu options', async () => {
      const callSid = 'test-call-123';
      const result = await service.handleGreeting(callSid);

      expect(result).toBeDefined();
      expect(twilioService.createTwiMLResponse).toHaveBeenCalledWith(
        expect.stringContaining('Welcome to Test Company'),
        expect.objectContaining({
          action: '/voice-bot/menu-choice',
          timeout: 10,
        }),
      );
    });
  });

  describe('handleMenuChoice', () => {
    it('should handle DTMF input for booking appointment', async () => {
      const callSid = 'test-call-123';
      const userInput = '1';

      const result = await service.handleMenuChoice(userInput, callSid);

      expect(result).toBeDefined();
      expect(twilioService.createTwiMLResponse).toHaveBeenCalledWith(
        expect.stringContaining('book an appointment'),
        expect.objectContaining({
          action: '/voice-bot/booking-date',
        }),
      );
    });

    it('should handle voice input for checking booking', async () => {
      const callSid = 'test-call-123';
      const userInput = 'check my booking';

      const result = await service.handleMenuChoice(userInput, callSid);

      expect(result).toBeDefined();
      expect(twilioService.createTwiMLResponse).toHaveBeenCalledWith(
        expect.stringContaining('check your booking'),
        expect.objectContaining({
          action: '/voice-bot/booking-lookup',
        }),
      );
    });
  });

  describe('handleBookingDate', () => {
    it('should parse and accept valid date input', async () => {
      const callSid = 'test-call-123';
      const userInput = 'tomorrow';

      const result = await service.handleBookingDate(userInput, callSid);

      expect(result).toBeDefined();
      expect(twilioService.createTwiMLResponse).toHaveBeenCalledWith(
        expect.stringContaining('Great! I have'),
        expect.objectContaining({
          action: '/voice-bot/booking-time',
        }),
      );
    });

    it('should handle invalid date input', async () => {
      const callSid = 'test-call-123';
      const userInput = 'invalid date';

      const result = await service.handleBookingDate(userInput, callSid);

      expect(result).toBeDefined();
      expect(twilioService.createTwiMLResponse).toHaveBeenCalledWith(
        expect.stringContaining("I'm sorry, I didn't understand"),
        expect.objectContaining({
          action: '/voice-bot/booking-date',
        }),
      );
    });
  });

  describe('handleBookingTime', () => {
    it('should parse and accept valid time input', async () => {
      const callSid = 'test-call-123';
      const userInput = '2 PM';

      // Set up session with date
      await service.handleBookingDate('tomorrow', callSid);
      
      const result = await service.handleBookingTime(userInput, callSid);

      expect(result).toBeDefined();
      expect(bookingService.createBooking).toHaveBeenCalled();
      expect(twilioService.createTwiMLResponse).toHaveBeenCalledWith(
        expect.stringContaining('Perfect! I have scheduled'),
        expect.objectContaining({
          action: '/voice-bot/booking-confirmation',
        }),
      );
    });
  });

  describe('handleBookingLookup', () => {
    it('should find existing booking by ID', async () => {
      const callSid = 'test-call-123';
      const bookingId = 'test-booking-123';
      const mockBooking = {
        id: bookingId,
        date: 'December 15, 2023',
        time: '2:00 PM',
      };

      mockBookingService.findBookingById.mockResolvedValue(mockBooking);

      const result = await service.handleBookingLookup(bookingId, callSid);

      expect(result).toBeDefined();
      expect(bookingService.findBookingById).toHaveBeenCalledWith(bookingId);
      expect(twilioService.createTwiMLResponse).toHaveBeenCalledWith(
        expect.stringContaining('I found your booking'),
        expect.objectContaining({
          action: '/voice-bot/post-action',
        }),
      );
    });

    it('should handle booking not found', async () => {
      const callSid = 'test-call-123';
      const bookingId = 'non-existent-booking';

      mockBookingService.findBookingById.mockResolvedValue(null);

      const result = await service.handleBookingLookup(bookingId, callSid);

      expect(result).toBeDefined();
      expect(twilioService.createTwiMLResponse).toHaveBeenCalledWith(
        expect.stringContaining("I'm sorry, I couldn't find"),
        expect.objectContaining({
          action: '/voice-bot/support-transfer',
        }),
      );
    });
  });

  describe('date and time parsing', () => {
    it('should parse common date expressions', () => {
      const service_any = service as any;
      
      expect(service_any.parseDateInput('tomorrow')).toContain('2025');
      expect(service_any.parseDateInput('today')).toContain('2025');
      expect(service_any.parseDateInput('monday')).toContain('2025');
    });

    it('should parse common time expressions', () => {
      const service_any = service as any;
      
      expect(service_any.parseTimeInput('morning')).toBe('10:00 AM');
      expect(service_any.parseTimeInput('afternoon')).toBe('2:00 PM');
      expect(service_any.parseTimeInput('2 PM')).toBe('2:00 PM');
      expect(service_any.parseTimeInput('10:30 AM')).toBe('10:30 AM');
    });
  });

  describe('error handling', () => {
    it('should handle unknown input with retry logic', async () => {
      const callSid = 'test-call-123';

      const result = await service.handleUnknownInput(callSid);

      expect(result).toBeDefined();
      expect(twilioService.createTwiMLResponse).toHaveBeenCalledWith(
        expect.stringContaining("Sorry, I didn't catch that"),
        expect.objectContaining({
          action: '/voice-bot/menu-choice',
        }),
      );
    });

    it('should transfer to support after max retries', async () => {
      const callSid = 'test-call-123';
      
      // Simulate multiple retries
      await service.handleUnknownInput(callSid);
      await service.handleUnknownInput(callSid);
      const result = await service.handleUnknownInput(callSid);

      expect(result).toBeDefined();
      expect(twilioService.createTwiMLResponse).toHaveBeenCalledWith(
        expect.stringContaining('connect you to one of our support agents'),
      );
    });
  });
});
