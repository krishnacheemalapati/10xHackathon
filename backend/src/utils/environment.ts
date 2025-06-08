// Environment configuration and validation
import dotenv from 'dotenv';

dotenv.config();

export class Environment {
  // API Keys
  static readonly COHERE_API_KEY = process.env.COHERE_API_KEY!;
  static readonly GOOGLE_CLOUD_VISION_KEY = process.env.GOOGLE_CLOUD_VISION_KEY!;
  static readonly TWILIO_SID = process.env.TWILIO_SID!;
  static readonly TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!;
  static readonly TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER!;
  static readonly HEYGEN_API_KEY = process.env.HEYGEN_API_KEY!;

  // Server Configuration
  static readonly PORT = parseInt(process.env.PORT || '3000');
  static readonly NODE_ENV = process.env.NODE_ENV || 'development';

  // Database
  static readonly DATABASE_URL = process.env.DATABASE_URL || '';

  // URLs
  static readonly FRONTEND_WEB_URL = process.env.FRONTEND_WEB_URL || 'http://localhost:3001';
  static readonly FRONTEND_MOBILE_URL = process.env.FRONTEND_MOBILE_URL || 'http://localhost:19006';

  // Validation
  static validate(): void {
    const required = [
      'COHERE_API_KEY',
      'GOOGLE_CLOUD_VISION_KEY', 
      'TWILIO_SID',
      'TWILIO_AUTH_TOKEN',
      'TWILIO_PHONE_NUMBER'
    ];

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    }

    console.log('✅ Environment variables validated successfully');
  }

  static isDevelopment(): boolean {
    return this.NODE_ENV === 'development';
  }

  static isProduction(): boolean {
    return this.NODE_ENV === 'production';
  }
}

// Validate on import
Environment.validate();
