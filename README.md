# AI Voice Bot - NestJS Edition

A sophisticated conversational AI voice bot built with NestJS, TypeScript, and Twilio that handles phone calls with natural language processing and DTMF input support.

## 🚀 Features

- **Natural Language Processing**: Understands both spoken commands and DTMF keypad inputs
- **Appointment Booking**: Complete booking flow with date/time selection and confirmation
- **Booking Management**: Check existing bookings by ID or name
- **Customer Support**: Intelligent call routing and support transfer
- **Working Hours**: Automated business hours information
- **Error Handling**: Robust fallback mechanisms with retry logic
- **Database Integration**: PostgreSQL with TypeORM for persistent data storage
- **OpenAI Integration**: Advanced NLP for better intent recognition
- **Swagger Documentation**: Complete API documentation
- **Docker Support**: Containerized deployment ready

## 🛠️ Tech Stack

- **Backend**: NestJS, TypeScript
- **Database**: PostgreSQL with TypeORM
- **Voice**: Twilio Voice API
- **AI**: OpenAI GPT for advanced NLP
- **Testing**: Jest
- **Documentation**: Swagger/OpenAPI
- **Deployment**: Docker, Docker Compose

## 🏗️ Architecture

The application follows a modular NestJS architecture:

- **VoiceBotModule**: Core conversation logic and call flow management
- **TwilioModule**: Twilio Voice API integration and TwiML generation
- **BookingModule**: Appointment booking and database operations
- **SessionModule**: Call session state management with Redis
- **RedisModule**: Redis connection and session storage operations
- **ConfigModule**: Environment configuration management

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database
- Redis server (for session management)
- Twilio account with Voice API access
- OpenAI API key (optional, for advanced NLP features)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-voice-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your configuration:
   ```env
   # Twilio Configuration
   TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
   TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
   TWILIO_PHONE_NUMBER=your_twilio_phone_number_here

   # OpenAI Configuration (optional)
   OPENAI_API_KEY=your_openai_api_key_here

   # Application Configuration
   COMPANY_NAME=Your Company Name
   PORT=3000
   NODE_ENV=development

   # PostgreSQL Database Configuration
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_USERNAME=postgres
   DATABASE_PASSWORD=password
   DATABASE_NAME=voice_bot
   ```

4. **Database Setup**
   
   **Option 1: Using Docker (Recommended)**
   ```bash
   docker-compose up -d postgres
   # Create database
   createdb voice_bot
   
   # Or using psql
   psql -U postgres
   CREATE DATABASE voice_bot;
   \q
   ```

5. **Set up Redis server**
   ```bash
   # Install Redis (macOS with Homebrew)
   brew install redis
   brew services start redis
   
   # Install Redis (Ubuntu/Debian)
   sudo apt update
   sudo apt install redis-server
   sudo systemctl start redis-server
   
   # Install Redis (CentOS/RHEL)
   sudo yum install redis
   sudo systemctl start redis
   
   # Test Redis connection
   redis-cli ping
   # Should return: PONG
   ```

## 🚀 Running the Application

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

### Using Docker
```bash
docker-compose up -d
```

The application will be available at:
- **API**: http://localhost:3000
- **Documentation**: http://localhost:3000/api

## 📞 Twilio Webhook Configuration

Configure your Twilio phone number webhook URL to:
```
https://your-domain.com/voice-bot/webhook
```

For local development with ngrok:
```bash
ngrok http 3000
# Use the HTTPS URL: https://abc123.ngrok.io/voice-bot/webhook
```

## 🎯 Conversation Flow

### Main Menu Options
1. **Press 1** or say **"Book an appointment"**
2. **Press 2** or say **"Check my booking"**
3. **Press 3** or say **"Talk to customer support"**
4. **Press 4** or say **"Hear our working hours"**
5. **Press 5** or say **"Make a payment"**
6. **Press 6** or say **"Set a reminder"**

### Booking Flow
1. **Date Selection**: "tomorrow", "next Monday", "December 15th"
2. **Time Selection**: "2 PM", "morning", "10:30 AM"
3. **Confirmation**: Confirm details and receive booking ID
4. **Post-booking**: Return to menu or end call

### Error Handling
- **Unknown Input**: Retry with clarification (max 2 attempts)
- **Failed Recognition**: Transfer to human support
- **System Errors**: Graceful fallback messages

## 🧪 Testing

```bash
# Unit tests
npm run test

# Test coverage
npm run test:cov

# E2E tests
npm run test:e2e

# Watch mode
npm run test:watch
```

## 📊 API Endpoints

### Voice Bot Webhooks
- `POST /voice-bot/webhook` - Main entry point for incoming calls
- `POST /voice-bot/menu-choice` - Handle menu selections
- `POST /voice-bot/booking-date` - Process booking date input
- `POST /voice-bot/booking-time` - Process booking time input
- `POST /voice-bot/booking-confirmation` - Handle booking confirmation
- `POST /voice-bot/booking-lookup` - Look up existing bookings
- `POST /voice-bot/post-booking` - Post-booking navigation
- `POST /voice-bot/post-action` - General post-action handling
- `POST /voice-bot/support-transfer` - Support transfer decisions
- `POST /voice-bot/main-menu` - Return to main menu

### Health Check
- `GET /` - Application health status

## 🏗️ Project Structure

```
src/
├── booking/                 # Booking management
│   ├── entities/
│   │   └── booking.entity.ts
│   ├── booking.service.ts
│   └── booking.module.ts
├── common/                  # Shared interfaces and utilities
│   └── interfaces/
│       └── call-session.interface.ts
├── twilio/                  # Twilio integration
│   ├── twilio.service.ts
│   └── twilio.module.ts
├── voice-bot/              # Core voice bot logic
│   ├── voice-bot.controller.ts
│   ├── voice-bot.service.ts
│   ├── voice-bot.module.ts
│   └── voice-bot.service.spec.ts
├── app.module.ts           # Main application module
└── main.ts                 # Application entry point
```

## 🔧 Configuration

### Working Hours
Modify working hours in `voice-bot.service.ts`:
```typescript
private getWorkingHours() {
  return {
    monday: { open: '09:00', close: '17:00' },
    tuesday: { open: '09:00', close: '17:00' },
    // ... customize as needed
  };
}
```

### Menu Options
Add or modify menu options in the service:
```typescript
private getMenuOptions() {
  return {
    '1': MenuOption.BOOK_APPOINTMENT,
    '2': MenuOption.CHECK_BOOKING,
    // ... add new options
  };
}
```

## 🚀 Deployment

### Using Docker Compose (Recommended)
```bash
# Start all services (app, PostgreSQL, Redis)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Considerations
- Use environment variables for all sensitive configuration
- Set up proper logging and monitoring
- Configure database backups
- Use Redis for session management in multi-instance deployments
- Set up SSL/TLS termination
- Configure rate limiting and security headers

## 🔍 Monitoring & Debugging

### Health Checks
The application includes health check endpoints for monitoring:
- Application status
- Database connectivity
- External service availability

### Logging
Structured logging is implemented throughout the application:
- Request/response logging
- Error tracking
- Performance metrics
- Call session tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the [API Documentation](http://localhost:3000/api)
- Review the test files for usage examples
- Open an issue for bugs or feature requests

## 🔮 Future Enhancements

- [ ] Multi-language support
- [ ] Voice recognition improvements
- [ ] Integration with calendar systems
- [ ] SMS notifications
- [ ] Payment processing
- [ ] Advanced analytics
- [ ] Machine learning for better intent recognition
- [ ] WebRTC support for browser-based calls
