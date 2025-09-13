import { Module } from '@nestjs/common';
import { VoiceBotController } from './voice-bot.controller';
import { VoiceBotService } from './voice-bot.service';
import { TwilioModule } from '../twilio/twilio.module';
import { BookingModule } from '../booking/booking.module';

@Module({
  imports: [TwilioModule, BookingModule],
  controllers: [VoiceBotController],
  providers: [VoiceBotService],
  exports: [VoiceBotService],
})
export class VoiceBotModule {}
