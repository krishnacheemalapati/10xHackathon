"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwilioNotificationService = void 0;
// Twilio Notification Service Implementation
const twilio_1 = __importDefault(require("twilio"));
const environment_1 = require("../utils/environment");
class TwilioNotificationService {
    constructor() {
        this.client = (0, twilio_1.default)(environment_1.Environment.TWILIO_SID, environment_1.Environment.TWILIO_AUTH_TOKEN);
    }
    sendSMS(phoneNumber, message) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.client.messages.create({
                    body: message,
                    from: environment_1.Environment.TWILIO_PHONE_NUMBER,
                    to: phoneNumber
                });
                console.log(`✅ SMS sent successfully: ${result.sid}`);
                return true;
            }
            catch (error) {
                console.error(`❌ SMS sending failed to ${phoneNumber}:`, error);
                return false;
            }
        });
    }
    makeCall(phoneNumber, message) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const twimlMessage = `<Response>
        <Say voice="alice" rate="medium">
          ${this.sanitizeForTwiML(message)}
        </Say>
        <Pause length="2"/>
        <Say voice="alice">
          This is an automated emergency notification from the AI Video Call Platform. 
          Please respond to this incident immediately.
        </Say>
      </Response>`;
                const result = yield this.client.calls.create({
                    twiml: twimlMessage,
                    from: environment_1.Environment.TWILIO_PHONE_NUMBER,
                    to: phoneNumber,
                    timeout: 30 // 30 seconds timeout
                });
                console.log(`✅ Call initiated successfully: ${result.sid}`);
                return true;
            }
            catch (error) {
                console.error(`❌ Call initiation failed to ${phoneNumber}:`, error);
                return false;
            }
        });
    }
    notifyEmergencyContacts(contacts, incident) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`🚨 Notifying ${contacts.length} emergency contacts for incident ${incident.id}`);
            // Sort contacts by priority (lower number = higher priority)
            const sortedContacts = contacts.sort((a, b) => a.priority - b.priority);
            const notificationPromises = sortedContacts.map((contact) => __awaiter(this, void 0, void 0, function* () {
                const message = this.buildEmergencyMessage(contact, incident);
                try {
                    // For critical incidents, make calls; for others, send SMS
                    if (incident.threatLevel === 'critical' || incident.threatLevel === 'high') {
                        yield this.makeCall(contact.phoneNumber, message);
                        // Also send SMS as backup
                        yield this.sendSMS(contact.phoneNumber, message);
                    }
                    else {
                        yield this.sendSMS(contact.phoneNumber, message);
                    }
                    console.log(`✅ Successfully notified ${contact.name} (${contact.type})`);
                }
                catch (error) {
                    console.error(`❌ Failed to notify ${contact.name}:`, error);
                }
            }));
            // Execute notifications with a slight delay between each to avoid rate limits
            for (let i = 0; i < notificationPromises.length; i++) {
                yield notificationPromises[i];
                if (i < notificationPromises.length - 1) {
                    yield this.delay(1000); // 1 second delay between notifications
                }
            }
        });
    }
    buildEmergencyMessage(contact, incident) {
        const baseMessage = `EMERGENCY ALERT - AI Video Call Platform

Incident ID: ${incident.id}
Threat Level: ${incident.threatLevel.toUpperCase()}
Time: ${incident.timestamp.toLocaleString()}

Description: ${incident.description}

Reason for contact: ${contact.reason}

This is an automated emergency notification. Please respond immediately.`;
        // Customize message based on contact type
        switch (contact.type) {
            case 'police':
                return `${baseMessage}\n\nRequesting immediate police response for potential emergency situation.`;
            case 'medical':
                return `${baseMessage}\n\nMedical assistance may be required. Please assess and respond accordingly.`;
            case 'crisis':
                return `${baseMessage}\n\nMental health crisis intervention needed. Please provide immediate support.`;
            case 'fire':
                return `${baseMessage}\n\nFire department response requested for emergency situation.`;
            case 'family':
                return `${baseMessage}\n\nPlease check on your family member immediately. Emergency services have been contacted.`;
            default:
                return baseMessage;
        }
    }
    sanitizeForTwiML(message) {
        // Remove special characters that might interfere with TwiML
        return message
            .replace(/[<>&'"]/g, '') // Remove XML special characters
            .replace(/\n/g, '. ') // Replace newlines with periods
            .trim();
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    // Additional utility methods for phone number validation
    validatePhoneNumber(phoneNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const lookup = yield this.client.lookups.v1.phoneNumbers(phoneNumber).fetch();
                return !!lookup.phoneNumber;
            }
            catch (error) {
                console.error(`❌ Phone number validation failed for ${phoneNumber}:`, error);
                return false;
            }
        });
    }
    getCallStatus(callSid) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const call = yield this.client.calls(callSid).fetch();
                return call.status;
            }
            catch (error) {
                console.error(`❌ Failed to get call status for ${callSid}:`, error);
                return 'unknown';
            }
        });
    }
    getSMSStatus(messageSid) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const message = yield this.client.messages(messageSid).fetch();
                return message.status;
            }
            catch (error) {
                console.error(`❌ Failed to get SMS status for ${messageSid}:`, error);
                return 'unknown';
            }
        });
    }
}
exports.TwilioNotificationService = TwilioNotificationService;
