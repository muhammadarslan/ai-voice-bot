import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VoiceBotService } from './voice-bot.service';

@ApiTags('voice-bot')
@Controller('voice-bot')
export class VoiceBotController {
  constructor(private readonly voiceBotService: VoiceBotService) {}

  @Post('webhook')
  @ApiOperation({ summary: 'Main webhook endpoint for incoming calls' })
  @ApiResponse({ status: 200, description: 'TwiML response' })
  async webhook(@Body() body: any, @Res() res: Response) {
    const callSid = body.CallSid;
    const twiml = await this.voiceBotService.handleGreeting(callSid);
    res.set('Content-Type', 'text/xml');
    res.status(HttpStatus.OK).send(twiml);
  }

  @Post('menu-choice')
  @ApiOperation({ summary: 'Handle main menu selection' })
  async handleMenuChoice(@Body() body: any, @Res() res: Response) {
    const callSid = body.CallSid;
    const userInput = body.SpeechResult || body.Digits;
    const twiml = await this.voiceBotService.handleMenuChoice(userInput, callSid);
    res.set('Content-Type', 'text/xml');
    res.status(HttpStatus.OK).send(twiml);
  }

  @Post('booking-date')
  @ApiOperation({ summary: 'Handle booking date input' })
  async handleBookingDate(@Body() body: any, @Res() res: Response) {
    const callSid = body.CallSid;
    const userInput = body.SpeechResult || body.Digits;
    const twiml = await this.voiceBotService.handleBookingDate(userInput, callSid);
    res.set('Content-Type', 'text/xml');
    res.status(HttpStatus.OK).send(twiml);
  }

  @Post('booking-time')
  @ApiOperation({ summary: 'Handle booking time input' })
  async handleBookingTime(@Body() body: any, @Res() res: Response) {
    const callSid = body.CallSid;
    const userInput = body.SpeechResult || body.Digits;
    const twiml = await this.voiceBotService.handleBookingTime(userInput, callSid);
    res.set('Content-Type', 'text/xml');
    res.status(HttpStatus.OK).send(twiml);
  }

  @Post('booking-confirmation')
  @ApiOperation({ summary: 'Handle booking confirmation' })
  async handleBookingConfirmation(@Body() body: any, @Res() res: Response) {
    const callSid = body.CallSid;
    const userInput = body.SpeechResult || body.Digits;
    const twiml = await this.voiceBotService.handleBookingConfirmation(userInput, callSid);
    res.set('Content-Type', 'text/xml');
    res.status(HttpStatus.OK).send(twiml);
  }

  @Post('booking-lookup')
  @ApiOperation({ summary: 'Handle booking lookup' })
  async handleBookingLookup(@Body() body: any, @Res() res: Response) {
    const callSid = body.CallSid;
    const userInput = body.SpeechResult || body.Digits;
    const twiml = await this.voiceBotService.handleBookingLookup(userInput, callSid);
    res.set('Content-Type', 'text/xml');
    res.status(HttpStatus.OK).send(twiml);
  }

  @Post('post-booking')
  @ApiOperation({ summary: 'Handle post-booking actions' })
  async handlePostBooking(@Body() body: any, @Res() res: Response) {
    const callSid = body.CallSid;
    const userInput = body.SpeechResult || body.Digits;
    
    if (userInput && ['main menu', 'menu'].some(phrase => userInput.toLowerCase().includes(phrase))) {
      const twiml = await this.voiceBotService.handleGreeting(callSid);
      res.set('Content-Type', 'text/xml');
      res.status(HttpStatus.OK).send(twiml);
    } else if (userInput && ['goodbye', 'bye'].some(phrase => userInput.toLowerCase().includes(phrase))) {
      const twiml = this.voiceBotService['twilioService'].createTwiMLResponse("Thank you for calling. Have a great day!");
      res.set('Content-Type', 'text/xml');
      res.status(HttpStatus.OK).send(twiml);
    } else {
      const twiml = await this.voiceBotService.handleGreeting(callSid);
      res.set('Content-Type', 'text/xml');
      res.status(HttpStatus.OK).send(twiml);
    }
  }

  @Post('post-action')
  @ApiOperation({ summary: 'Handle post-action navigation' })
  async handlePostAction(@Body() body: any, @Res() res: Response) {
    const callSid = body.CallSid;
    const userInput = body.SpeechResult || body.Digits;
    
    if (userInput && ['yes', 'main menu', 'menu'].some(phrase => userInput.toLowerCase().includes(phrase))) {
      const twiml = await this.voiceBotService.handleGreeting(callSid);
      res.set('Content-Type', 'text/xml');
      res.status(HttpStatus.OK).send(twiml);
    } else {
      const twiml = this.voiceBotService['twilioService'].createTwiMLResponse("Thank you for calling. Have a great day!");
      res.set('Content-Type', 'text/xml');
      res.status(HttpStatus.OK).send(twiml);
    }
  }

  @Post('support-transfer')
  @ApiOperation({ summary: 'Handle support transfer decision' })
  async handleSupportTransfer(@Body() body: any, @Res() res: Response) {
    const callSid = body.CallSid;
    const userInput = body.SpeechResult || body.Digits;
    
    if (userInput && ['yes', 'support'].some(phrase => userInput.toLowerCase().includes(phrase))) {
      const twiml = await this.voiceBotService.handleCustomerSupport(callSid);
      res.set('Content-Type', 'text/xml');
      res.status(HttpStatus.OK).send(twiml);
    } else {
      const twiml = await this.voiceBotService.handleGreeting(callSid);
      res.set('Content-Type', 'text/xml');
      res.status(HttpStatus.OK).send(twiml);
    }
  }

  @Post('main-menu')
  @ApiOperation({ summary: 'Redirect to main menu' })
  async mainMenu(@Body() body: any, @Res() res: Response) {
    const callSid = body.CallSid;
    const twiml = await this.voiceBotService.handleGreeting(callSid);
    res.set('Content-Type', 'text/xml');
    res.status(HttpStatus.OK).send(twiml);
  }
}
