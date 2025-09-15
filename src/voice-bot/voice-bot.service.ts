import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TwilioService } from '../twilio/twilio.service';
import { BookingService } from '../booking/booking.service';
import { SessionService } from '../session/session.service';
import { CallSession, CallState, MenuOption, BookingData } from '../common/interfaces/call-session.interface';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';

@Injectable()
export class VoiceBotService {
  private openai: OpenAI;

  constructor(
    private configService: ConfigService,
    private twilioService: TwilioService,
    private bookingService: BookingService,
    private sessionService: SessionService,
  ) {
    const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (openaiApiKey) {
      this.openai = new OpenAI({ apiKey: openaiApiKey });
    }
  }

  private getWorkingHours() {
    return {
      monday: { open: '09:00', close: '17:00' },
      tuesday: { open: '09:00', close: '17:00' },
      wednesday: { open: '09:00', close: '17:00' },
      thursday: { open: '09:00', close: '17:00' },
      friday: { open: '09:00', close: '17:00' },
      saturday: { open: '10:00', close: '14:00' },
      sunday: { open: 'closed', close: 'closed' }
    };
  }

  private getMenuOptions() {
    return {
      '1': MenuOption.BOOK_APPOINTMENT,
      '2': MenuOption.CHECK_BOOKING,
      '3': MenuOption.CUSTOMER_SUPPORT,
      '4': MenuOption.WORKING_HOURS,
      '5': MenuOption.MAKE_PAYMENT,
      '6': MenuOption.SET_REMINDER,
      '9': MenuOption.ENGLISH,
      '0': MenuOption.SPANISH
    };
  }

  private async getSessionData(callSid: string): Promise<CallSession> {
    return await this.sessionService.getSession(callSid);
  }

  private async parseUserInput(userInput: string, context: string = 'menu'): Promise<MenuOption | string> {
    if (!userInput) return null;

    const input = userInput.toLowerCase().trim();
    const menuOptions = this.getMenuOptions();

    // Handle DTMF inputs
    if (input.match(/^\d$/) && menuOptions[input]) {
      return menuOptions[input];
    }

    // Handle spoken responses using keyword matching
    const intentKeywords = {
      [MenuOption.BOOK_APPOINTMENT]: ['book', 'appointment', 'schedule', 'reserve', 'make appointment'],
      [MenuOption.CHECK_BOOKING]: ['check', 'booking', 'reservation', 'my appointment', 'find booking'],
      [MenuOption.CUSTOMER_SUPPORT]: ['support', 'help', 'agent', 'human', 'talk to someone', 'representative'],
      [MenuOption.WORKING_HOURS]: ['hours', 'open', 'closed', 'time', 'when open', 'business hours'],
      [MenuOption.MAKE_PAYMENT]: ['payment', 'pay', 'bill', 'invoice', 'charge'],
      [MenuOption.SET_REMINDER]: ['reminder', 'remind', 'alert', 'notification']
    };

    for (const [intent, keywords] of Object.entries(intentKeywords)) {
      if (keywords.some(keyword => input.includes(keyword))) {
        return intent as MenuOption;
      }
    }

    // Use OpenAI for more complex understanding if available
    if (this.openai && context === 'menu') {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are helping classify user intent for a voice bot. Return only one of: book_appointment, check_booking, customer_support, working_hours, make_payment, set_reminder, or "unknown" if unclear.'
            },
            { role: 'user', content: `User said: '${userInput}'` }
          ],
          max_tokens: 10
        });
        return response.choices[0].message.content.trim();
      } catch (error) {
        console.error('OpenAI error:', error);
      }
    }

    return 'unknown';
  }

  async handleGreeting(callSid: string): Promise<string> {
    const session = await this.getSessionData(callSid);
    await this.sessionService.updateSession(callSid, { state: CallState.MAIN_MENU });

    const companyName = this.configService.get<string>('COMPANY_NAME', 'Your Company');
    const message = `Hello! Welcome to ${companyName}. I'm your virtual assistant. Please choose from the following options: ` +
      'Press 1 or say "Book an appointment". ' +
      'Press 2 or say "Check my booking". ' +
      'Press 3 or say "Talk to customer support". ' +
      'Press 4 or say "Hear our working hours". ' +
      'Press 5 or say "Make a payment". ' +
      'Press 6 or say "Set a reminder".';

    const gatherOptions = {
      action: '/voice-bot/menu-choice',
      timeout: 10,
      speechTimeout: 'auto'
    };

    return this.twilioService.createTwiMLResponse(message, gatherOptions);
  }

  async handleMenuChoice(userInput: string, callSid: string): Promise<string> {
    const session = await this.getSessionData(callSid);
    const intent = await this.parseUserInput(userInput);

    switch (intent) {
      case MenuOption.BOOK_APPOINTMENT:
        return this.handleBookAppointment(callSid);
      case MenuOption.CHECK_BOOKING:
        return this.handleCheckBooking(callSid);
      case MenuOption.CUSTOMER_SUPPORT:
        return this.handleCustomerSupport(callSid);
      case MenuOption.WORKING_HOURS:
        return this.handleWorkingHours(callSid);
      case MenuOption.MAKE_PAYMENT:
        return this.handlePayment(callSid);
      case MenuOption.SET_REMINDER:
        return this.handleReminder(callSid);
      default:
        return this.handleUnknownInput(callSid);
    }
  }

  async handleBookAppointment(callSid: string): Promise<string> {
    const session = await this.getSessionData(callSid);
    await this.sessionService.updateSession(callSid, { state: CallState.BOOKING_DATE });

    const message = "I'd be happy to help you book an appointment. " +
      "Please tell me your preferred date. You can say something like 'tomorrow', 'next Monday', or a specific date like 'December 15th'.";

    const gatherOptions = {
      action: '/voice-bot/booking-date',
      timeout: 15,
      speechTimeout: 'auto'
    };

    return this.twilioService.createTwiMLResponse(message, gatherOptions);
  }

  async handleBookingDate(userInput: string, callSid: string): Promise<string> {
    const session = await this.getSessionData(callSid);
    const dateStr = this.parseDateInput(userInput);

    if (dateStr) {
      const updatedBookingData = { ...session.bookingData, date: dateStr };
      await this.sessionService.updateSession(callSid, { 
        bookingData: updatedBookingData, 
        state: CallState.BOOKING_TIME 
      });

      const message = `Great! I have ${dateStr} noted. ` +
        "What time would you prefer? You can say something like '2 PM', '10:30 AM', or 'morning'.";

      const gatherOptions = {
        action: '/voice-bot/booking-time',
        timeout: 15,
        speechTimeout: 'auto'
      };

      return this.twilioService.createTwiMLResponse(message, gatherOptions);
    } else {
      const message = "I'm sorry, I didn't understand that date. " +
        "Could you please repeat it? For example, say 'tomorrow', 'next Monday', or 'December 15th'.";

      const gatherOptions = {
        action: '/voice-bot/booking-date',
        timeout: 15,
        speechTimeout: 'auto'
      };

      return this.twilioService.createTwiMLResponse(message, gatherOptions);
    }
  }

  async handleBookingTime(userInput: string, callSid: string): Promise<string> {
    const session = await this.getSessionData(callSid);
    const timeStr = this.parseTimeInput(userInput);

    if (timeStr) {
      const bookingId = uuidv4().substring(0, 8);
      const updatedBookingData = { 
        ...session.bookingData, 
        time: timeStr, 
        id: bookingId 
      };
      
      await this.sessionService.updateSession(callSid, { 
        bookingData: updatedBookingData, 
        state: CallState.BOOKING_CONFIRMATION 
      });

      // Store booking in database
      try {
        await this.bookingService.createBooking(updatedBookingData, callSid);
      } catch (error) {
        console.error('Error creating booking:', error);
      }

      const message = `Perfect! I have scheduled your appointment for ${updatedBookingData.date} at ${timeStr}. ` +
        `Your booking ID is ${bookingId}. ` +
        "Is this correct? Say 'yes' to confirm or 'no' to make changes.";

      const gatherOptions = {
        action: '/voice-bot/booking-confirmation',
        timeout: 10,
        speechTimeout: 'auto'
      };

      return this.twilioService.createTwiMLResponse(message, gatherOptions);
    } else {
      const message = "I'm sorry, I didn't understand that time. " +
        "Could you please repeat it? For example, say '2 PM', '10:30 AM', or 'morning'.";

      const gatherOptions = {
        action: '/voice-bot/booking-time',
        timeout: 15,
        speechTimeout: 'auto'
      };

      return this.twilioService.createTwiMLResponse(message, gatherOptions);
    }
  }

  async handleBookingConfirmation(userInput: string, callSid: string): Promise<string> {
    const session = await this.getSessionData(callSid);

    if (userInput && ['yes', 'confirm', 'correct'].some(word => userInput.toLowerCase().includes(word))) {
      const message = "Excellent! Your appointment has been confirmed. " +
        `Your booking ID is ${session.bookingData.id}. ` +
        "You'll receive a confirmation. Is there anything else I can help you with today? " +
        "Say 'main menu' to return to the main menu or 'goodbye' to end the call.";

      const gatherOptions = {
        action: '/voice-bot/post-booking',
        timeout: 10,
        speechTimeout: 'auto'
      };

      return this.twilioService.createTwiMLResponse(message, gatherOptions);
    } else {
      // Go back to date selection
      await this.sessionService.updateSession(callSid, { state: CallState.BOOKING_DATE });
      const message = "No problem! Let's start over. What date would you prefer for your appointment?";

      const gatherOptions = {
        action: '/voice-bot/booking-date',
        timeout: 15,
        speechTimeout: 'auto'
      };

      return this.twilioService.createTwiMLResponse(message, gatherOptions);
    }
  }

  async handleCheckBooking(callSid: string): Promise<string> {
    const session = await this.getSessionData(callSid);
    await this.sessionService.updateSession(callSid, { state: CallState.CHECK_BOOKING });

    const message = "I can help you check your booking. " +
      "Please provide your booking ID, or say your full name if you don't have the ID.";

    const gatherOptions = {
      action: '/voice-bot/booking-lookup',
      timeout: 15,
      speechTimeout: 'auto'
    };

    return this.twilioService.createTwiMLResponse(message, gatherOptions);
  }

  async handleBookingLookup(userInput: string, callSid: string): Promise<string> {
    if (!userInput) {
      return this.handleUnknownInput(callSid);
    }

    const input = userInput.trim();

    try {
      // Try to find booking by ID first
      const booking = await this.bookingService.findBookingById(input);
      
      if (booking) {
        const message = `I found your booking! You have an appointment scheduled for ${booking.date} at ${booking.time}. ` +
          "Is there anything else I can help you with? Say 'main menu' to return to the main menu.";

        const gatherOptions = {
          action: '/voice-bot/post-action',
          timeout: 10,
          speechTimeout: 'auto'
        };

        return this.twilioService.createTwiMLResponse(message, gatherOptions);
      } else {
        const message = "I'm sorry, I couldn't find a booking with that information. " +
          "Please double-check your booking ID or contact our support team. " +
          "Would you like me to transfer you to customer support? Say 'yes' or 'no'.";

        const gatherOptions = {
          action: '/voice-bot/support-transfer',
          timeout: 10,
          speechTimeout: 'auto'
        };

        return this.twilioService.createTwiMLResponse(message, gatherOptions);
      }
    } catch (error) {
      console.error('Error looking up booking:', error);
      return this.handleCustomerSupport(callSid);
    }
  }

  async handleCustomerSupport(callSid: string): Promise<string> {
    const message = "I'm connecting you to one of our customer support representatives. Please hold while I transfer your call.";
    
    // In production, implement actual call transfer logic
    const followUpMessage = "I'm sorry, all our agents are currently busy. Please call back later or leave a message after the beep.";
    
    return this.twilioService.createTwiMLResponse(message + ' ' + followUpMessage);
  }

  async handleWorkingHours(callSid: string): Promise<string> {
    const workingHours = this.getWorkingHours();
    let hoursText = "Our working hours are: ";
    
    for (const [day, hours] of Object.entries(workingHours)) {
      if (hours.open === 'closed') {
        hoursText += `${day.charAt(0).toUpperCase() + day.slice(1)}: Closed. `;
      } else {
        hoursText += `${day.charAt(0).toUpperCase() + day.slice(1)}: ${hours.open} to ${hours.close}. `;
      }
    }
    
    hoursText += "Would you like to return to the main menu? Say 'yes' or 'main menu'.";

    const gatherOptions = {
      action: '/voice-bot/post-action',
      timeout: 10,
      speechTimeout: 'auto'
    };

    return this.twilioService.createTwiMLResponse(hoursText, gatherOptions);
  }

  async handlePayment(callSid: string): Promise<string> {
    const message = "For payment processing, I'll need to transfer you to our secure payment system. " +
      "Please have your payment information ready. Connecting you now... " +
      "Payment system is currently unavailable. Please try again later or contact support.";

    return this.twilioService.createTwiMLResponse(message, null, '/voice-bot/main-menu');
  }

  async handleReminder(callSid: string): Promise<string> {
    const message = "I can help you set a reminder for your appointment. " +
      "This feature is currently being set up. " +
      "For now, please make a note of your appointment details. " +
      "Would you like to return to the main menu?";

    const gatherOptions = {
      action: '/voice-bot/post-action',
      timeout: 10,
      speechTimeout: 'auto'
    };

    return this.twilioService.createTwiMLResponse(message, gatherOptions);
  }

  async handleUnknownInput(callSid: string): Promise<string> {
    const session = await this.getSessionData(callSid);
    const newRetryCount = session.retryCount + 1;
    await this.sessionService.updateSession(callSid, { retryCount: newRetryCount });

    if (newRetryCount >= 2) {
      const message = "I'm having trouble understanding you. Let me connect you to one of our support agents for further assistance.";
      return this.handleCustomerSupport(callSid);
    }

    const message = "Sorry, I didn't catch that. Could you please repeat your choice? " +
      "You can press a number on your keypad or speak your selection.";

    const gatherOptions = {
      action: '/voice-bot/menu-choice',
      timeout: 10,
      speechTimeout: 'auto'
    };

    return this.twilioService.createTwiMLResponse(message, gatherOptions);
  }

  private parseDateInput(userInput: string): string | null {
    if (!userInput) return null;

    const input = userInput.toLowerCase();
    const today = new Date();

    if (input.includes('tomorrow')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return tomorrow.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }

    if (input.includes('today')) {
      return today.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }

    // Handle day names
    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    for (let i = 0; i < dayNames.length; i++) {
      if (input.includes(dayNames[i])) {
        const daysAhead = (i - today.getDay() + 7) % 7 || 7;
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + daysAhead);
        return targetDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
    }

    return userInput; // Return as-is if can't parse
  }

  private parseTimeInput(userInput: string): string | null {
    if (!userInput) return null;

    const input = userInput.toLowerCase();

    if (input.includes('morning')) return '10:00 AM';
    if (input.includes('afternoon')) return '2:00 PM';
    if (input.includes('evening')) return '5:00 PM';
    if (input.includes('noon')) return '12:00 PM';

    // Try to extract time patterns
    const timePattern = /(\d{1,2}):?(\d{0,2})\s*(am|pm|a\.m\.|p\.m\.)?/i;
    const match = input.match(timePattern);

    if (match) {
      let hour = parseInt(match[1]);
      const minute = match[2] || '00';
      const period = match[3];

      if (period && period.toLowerCase().includes('p') && hour < 12) {
        hour += 12;
      } else if (period && period.toLowerCase().includes('a') && hour === 12) {
        hour = 0;
      }

      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const displayPeriod = hour >= 12 ? 'PM' : 'AM';
      return `${displayHour}:${minute.padStart(2, '0')} ${displayPeriod}`;
    }

    return userInput; // Return as-is if can't parse
  }
}
