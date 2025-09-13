export interface CallSession {
  callSid: string;
  state: CallState;
  retryCount: number;
  bookingData: BookingData;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingData {
  id?: string;
  date?: string;
  time?: string;
  customerName?: string;
  customerPhone?: string;
}

export enum CallState {
  GREETING = 'greeting',
  MAIN_MENU = 'main_menu',
  BOOKING_DATE = 'booking_date',
  BOOKING_TIME = 'booking_time',
  BOOKING_CONFIRMATION = 'booking_confirmation',
  CHECK_BOOKING = 'check_booking',
  CUSTOMER_SUPPORT = 'customer_support',
  WORKING_HOURS = 'working_hours',
  PAYMENT = 'payment',
  REMINDER = 'reminder',
  COMPLETED = 'completed'
}

export enum MenuOption {
  BOOK_APPOINTMENT = 'book_appointment',
  CHECK_BOOKING = 'check_booking',
  CUSTOMER_SUPPORT = 'customer_support',
  WORKING_HOURS = 'working_hours',
  MAKE_PAYMENT = 'make_payment',
  SET_REMINDER = 'set_reminder',
  ENGLISH = 'english',
  SPANISH = 'spanish'
}
