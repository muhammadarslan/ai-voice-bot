import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { BookingData } from '../common/interfaces/call-session.interface';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
  ) {}

  async createBooking(bookingData: BookingData, callSid: string): Promise<Booking> {
    const booking = this.bookingRepository.create({
      ...bookingData,
      callSid,
    });
    return await this.bookingRepository.save(booking);
  }

  async findBookingById(id: string): Promise<Booking | null> {
    return await this.bookingRepository.findOne({ where: { id } });
  }

  async findBookingsByPhone(phone: string): Promise<Booking[]> {
    return await this.bookingRepository.find({ 
      where: { customerPhone: phone },
      order: { createdAt: 'DESC' }
    });
  }

  async findBookingsByName(name: string): Promise<Booking[]> {
    return await this.bookingRepository.find({ 
      where: { customerName: name },
      order: { createdAt: 'DESC' }
    });
  }

  async getAllBookings(): Promise<Booking[]> {
    return await this.bookingRepository.find({
      order: { createdAt: 'DESC' }
    });
  }

  async updateBooking(id: string, updateData: Partial<Booking>): Promise<Booking> {
    await this.bookingRepository.update(id, updateData);
    return await this.findBookingById(id);
  }

  async deleteBooking(id: string): Promise<void> {
    await this.bookingRepository.delete(id);
  }
}
