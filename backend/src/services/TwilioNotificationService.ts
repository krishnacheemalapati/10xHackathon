// Twilio Notification Service Implementation
import twilio from 'twilio';
import { Environment } from '../utils/environment';
import { INotificationService } from './interfaces';
import { EmergencyContact, EmergencyIncident } from '../types';

export class TwilioNotificationService implements INotificationService {
  private client: twilio.Twilio;

  constructor() {
    this.client = twilio(Environment.TWILIO_SID, Environment.TWILIO_AUTH_TOKEN);
  }

  async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    try {
      const result = await this.client.messages.create({
        body: message,
        from: Environment.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      console.log(`✅ SMS sent successfully: ${result.sid}`);
      return true;
    } catch (error) {
      console.error(`❌ SMS sending failed to ${phoneNumber}:`, error);
      return false;
    }
  }

  async makeCall(phoneNumber: string, message: string): Promise<boolean> {
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

      const result = await this.client.calls.create({
        twiml: twimlMessage,
        from: Environment.TWILIO_PHONE_NUMBER,
        to: phoneNumber,
        timeout: 30 // 30 seconds timeout
      });

      console.log(`✅ Call initiated successfully: ${result.sid}`);
      return true;
    } catch (error) {
      console.error(`❌ Call initiation failed to ${phoneNumber}:`, error);
      return false;
    }
  }

  async notifyEmergencyContacts(contacts: EmergencyContact[], incident: EmergencyIncident): Promise<void> {
    console.log(`🚨 Notifying ${contacts.length} emergency contacts for incident ${incident.id}`);

    // Sort contacts by priority (lower number = higher priority)
    const sortedContacts = contacts.sort((a, b) => a.priority - b.priority);

    const notificationPromises = sortedContacts.map(async (contact) => {
      const message = this.buildEmergencyMessage(contact, incident);
      
      try {
        // For critical incidents, make calls; for others, send SMS
        if (incident.threatLevel === 'critical' || incident.threatLevel === 'high') {
          await this.makeCall(contact.phoneNumber, message);
          // Also send SMS as backup
          await this.sendSMS(contact.phoneNumber, message);
        } else {
          await this.sendSMS(contact.phoneNumber, message);
        }

        console.log(`✅ Successfully notified ${contact.name} (${contact.type})`);
      } catch (error) {
        console.error(`❌ Failed to notify ${contact.name}:`, error);
      }
    });

    // Execute notifications with a slight delay between each to avoid rate limits
    for (let i = 0; i < notificationPromises.length; i++) {
      await notificationPromises[i];
      if (i < notificationPromises.length - 1) {
        await this.delay(1000); // 1 second delay between notifications
      }
    }
  }

  private buildEmergencyMessage(contact: EmergencyContact, incident: EmergencyIncident): string {
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

  private sanitizeForTwiML(message: string): string {
    // Remove special characters that might interfere with TwiML
    return message
      .replace(/[<>&'"]/g, '') // Remove XML special characters
      .replace(/\n/g, '. ') // Replace newlines with periods
      .trim();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Additional utility methods for phone number validation
  async validatePhoneNumber(phoneNumber: string): Promise<boolean> {
    try {
      const lookup = await this.client.lookups.v1.phoneNumbers(phoneNumber).fetch();
      return !!lookup.phoneNumber;
    } catch (error) {
      console.error(`❌ Phone number validation failed for ${phoneNumber}:`, error);
      return false;
    }
  }

  async getCallStatus(callSid: string): Promise<string> {
    try {
      const call = await this.client.calls(callSid).fetch();
      return call.status;
    } catch (error) {
      console.error(`❌ Failed to get call status for ${callSid}:`, error);
      return 'unknown';
    }
  }

  async getSMSStatus(messageSid: string): Promise<string> {
    try {
      const message = await this.client.messages(messageSid).fetch();
      return message.status;
    } catch (error) {
      console.error(`❌ Failed to get SMS status for ${messageSid}:`, error);
      return 'unknown';
    }
  }
}
