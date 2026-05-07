
import { Lead, MessageTemplate, MessageLog, ChannelSettings, LeadActivity } from '../types';

export const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: 'welcome-wa',
    name: 'Welcome Message (WhatsApp)',
    type: 'WhatsApp',
    body: 'Hi {{name}}, greetings from Travel Bliss Kashmir! 😊 We saw you are interested in a {{trip_type}} trip to Kashmir in {{travel_month}}. I am {{agent_name}}, your dedicated travel consultant. Would you like to schedule a quick call?',
    isActive: true,
    delayHours: 24
  },
  {
    id: 'proposal-wa',
    name: 'Proposal Sent Follow-up',
    type: 'WhatsApp',
    body: 'Hi {{name}}, just checking if you had a chance to review the itinerary for your {{trip_name}}? Let me know if you want any adjustments! 🏔️',
    isActive: true,
    delayHours: 48
  },
  {
    id: 'booking-email',
    name: 'Booking Confirmation',
    type: 'Email',
    body: 'Dear {{name}},\n\nYour trip "{{trip_name}}" is now confirmed! 🏔️ We are excited to host you in the valley this {{travel_month}}.\n\nYour Agent,\n{{agent_name}}',
    isActive: true,
    delayHours: 0
  }
];

export function renderTemplate(templateBody: string, lead: Lead, agentName: string = "Adil Bakshi"): string {
  return templateBody
    .replace(/{{name}}/g, lead.name)
    .replace(/{{trip_type}}/g, lead.interest)
    .replace(/{{travel_month}}/g, lead.travelMonth)
    .replace(/{{trip_name}}/g, lead.notes || "Kashmir Trip")
    .replace(/{{agent_name}}/g, agentName);
}

// Added optional agentName parameter to support personalization and resolve type mismatch errors in callers
export async function sendSimulatedMessage(lead: Lead, template: MessageTemplate, agentName?: string): Promise<MessageLog> {
  const content = renderTemplate(template.body, lead, agentName);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const success = Math.random() > 0.05; // 95% success rate simulation

  return {
    id: `msg-${Date.now()}`,
    leadId: lead.id,
    type: template.type,
    content,
    timestamp: new Date().toISOString(),
    status: success ? 'Delivered' : 'Failed',
    templateId: template.id,
    errorMessage: success ? undefined : 'API Connection Timeout',
    retryCount: 0
  };
}

export function saveMessageLog(log: MessageLog) {
  const saved = localStorage.getItem('et_message_logs');
  const logs = saved ? JSON.parse(saved) : [];
  localStorage.setItem('et_message_logs', JSON.stringify([log, ...logs]));
}

export function getMessageLogsForLead(leadId: string): MessageLog[] {
  const saved = localStorage.getItem('et_message_logs');
  if (!saved) return [];
  const logs: MessageLog[] = JSON.parse(saved);
  return logs.filter(l => l.leadId === leadId);
}
