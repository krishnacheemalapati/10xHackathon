"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Environment = void 0;
// Environment configuration and validation
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class Environment {
    // Validation
    static validate() {
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
    static isDevelopment() {
        return this.NODE_ENV === 'development';
    }
    static isProduction() {
        return this.NODE_ENV === 'production';
    }
}
exports.Environment = Environment;
// API Keys
Environment.COHERE_API_KEY = process.env.COHERE_API_KEY;
Environment.GOOGLE_CLOUD_VISION_KEY = process.env.GOOGLE_CLOUD_VISION_KEY;
Environment.TWILIO_SID = process.env.TWILIO_SID;
Environment.TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
Environment.TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
Environment.HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;
// Server Configuration
Environment.PORT = parseInt(process.env.PORT || '3000');
Environment.NODE_ENV = process.env.NODE_ENV || 'development';
// Database
Environment.DATABASE_URL = process.env.DATABASE_URL || '';
// URLs
Environment.FRONTEND_WEB_URL = process.env.FRONTEND_WEB_URL || 'http://localhost:3001';
Environment.FRONTEND_MOBILE_URL = process.env.FRONTEND_MOBILE_URL || 'http://localhost:19006';
// Validate on import
Environment.validate();
