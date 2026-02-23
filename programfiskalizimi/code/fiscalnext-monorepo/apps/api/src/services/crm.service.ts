// CRM Integration Service - HubSpot, Salesforce
import axios, { AxiosInstance } from 'axios';
import { integrationService } from './integration.service';

export interface CRMContact {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  customFields?: Record<string, any>;
}

export interface CRMDeal {
  id?: string;
  name: string;
  amount: number;
  stage: string;
  contactId?: string;
  closeDate?: Date;
  customFields?: Record<string, any>;
}

export interface CRMActivity {
  type: string; // 'call', 'email', 'meeting', 'note'
  subject: string;
  description?: string;
  contactId?: string;
  dealId?: string;
  timestamp: Date;
}

export class CRMService {
  private client: AxiosInstance | null = null;

  /**
   * Initialize CRM client
   */
  async initialize(integrationId: string): Promise<void> {
    const integration = await integrationService.getIntegration(integrationId);
    if (!integration) {
      throw new Error('Integration not found');
    }

    const config = integration.config;

    if (integration.provider === 'hubspot') {
      this.client = axios.create({
        baseURL: 'https://api.hubapi.com',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });
    } else if (integration.provider === 'salesforce') {
      this.client = axios.create({
        baseURL: `${config.instanceUrl}/services/data/v57.0`,
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });
    }
  }

  /**
   * Sync contacts to CRM
   */
  async syncContacts(
    integrationId: string,
    contacts: CRMContact[]
  ): Promise<{ synced: number; errors: string[] }> {
    await this.initialize(integrationId);
    
    const stats = { synced: 0, errors: [] };
    const integration = await integrationService.getIntegration(integrationId);

    try {
      for (const contact of contacts) {
        try {
          if (integration.provider === 'hubspot') {
            await this.createHubSpotContact(contact);
          } else if (integration.provider === 'salesforce') {
            await this.createSalesforceContact(contact);
          }
          stats.synced++;
        } catch (error) {
          stats.errors.push(`${contact.email}: ${error.message}`);
        }
      }

      await integrationService.logAction(
        integrationId,
        'sync_contacts',
        'success',
        `Synced ${stats.synced} contacts`,
        stats
      );
    } catch (error) {
      await integrationService.logAction(
        integrationId,
        'sync_contacts',
        'error',
        `Contact sync failed: ${error.message}`
      );
      throw error;
    }

    return stats;
  }

  /**
   * Create deal from sale
   */
  async createDeal(integrationId: string, deal: CRMDeal): Promise<any> {
    await this.initialize(integrationId);
    const integration = await integrationService.getIntegration(integrationId);

    try {
      let result;

      if (integration.provider === 'hubspot') {
        result = await this.createHubSpotDeal(deal);
      } else if (integration.provider === 'salesforce') {
        result = await this.createSalesforceOpportunity(deal);
      }

      await integrationService.logAction(
        integrationId,
        'create_deal',
        'success',
        `Deal created: ${deal.name}`,
        { dealId: result.id }
      );

      return result;
    } catch (error) {
      await integrationService.logAction(
        integrationId,
        'create_deal',
        'error',
        `Failed to create deal: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Log activity
   */
  async logActivity(integrationId: string, activity: CRMActivity): Promise<any> {
    await this.initialize(integrationId);
    const integration = await integrationService.getIntegration(integrationId);

    try {
      let result;

      if (integration.provider === 'hubspot') {
        result = await this.createHubSpotActivity(activity);
      } else if (integration.provider === 'salesforce') {
        result = await this.createSalesforceTask(activity);
      }

      await integrationService.logAction(
        integrationId,
        'log_activity',
        'success',
        `Activity logged: ${activity.type}`
      );

      return result;
    } catch (error) {
      await integrationService.logAction(
        integrationId,
        'log_activity',
        'error',
        `Failed to log activity: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * HubSpot - Create contact
   */
  private async createHubSpotContact(contact: CRMContact): Promise<any> {
    const response = await this.client!.post('/crm/v3/objects/contacts', {
      properties: {
        email: contact.email,
        firstname: contact.firstName,
        lastname: contact.lastName,
        phone: contact.phone,
        company: contact.company,
        ...contact.customFields,
      },
    });

    return response.data;
  }

  /**
   * HubSpot - Create deal
   */
  private async createHubSpotDeal(deal: CRMDeal): Promise<any> {
    const response = await this.client!.post('/crm/v3/objects/deals', {
      properties: {
        dealname: deal.name,
        amount: deal.amount,
        dealstage: deal.stage,
        closedate: deal.closeDate?.toISOString(),
        ...deal.customFields,
      },
    });

    // Associate with contact if provided
    if (deal.contactId) {
      await this.client!.put(
        `/crm/v3/objects/deals/${response.data.id}/associations/contacts/${deal.contactId}/deal_to_contact`,
        {}
      );
    }

    return response.data;
  }

  /**
   * HubSpot - Create activity
   */
  private async createHubSpotActivity(activity: CRMActivity): Promise<any> {
    const engagementType = this.mapActivityTypeToHubSpot(activity.type);
    
    const response = await this.client!.post('/engagements/v1/engagements', {
      engagement: {
        type: engagementType,
        timestamp: activity.timestamp.getTime(),
      },
      metadata: {
        subject: activity.subject,
        body: activity.description,
      },
      associations: {
        contactIds: activity.contactId ? [activity.contactId] : [],
        dealIds: activity.dealId ? [activity.dealId] : [],
      },
    });

    return response.data;
  }

  /**
   * Salesforce - Create contact (Lead)
   */
  private async createSalesforceContact(contact: CRMContact): Promise<any> {
    const response = await this.client!.post('/sobjects/Lead', {
      Email: contact.email,
      FirstName: contact.firstName,
      LastName: contact.lastName,
      Phone: contact.phone,
      Company: contact.company || 'Unknown',
      ...contact.customFields,
    });

    return response.data;
  }

  /**
   * Salesforce - Create opportunity
   */
  private async createSalesforceOpportunity(deal: CRMDeal): Promise<any> {
    const response = await this.client!.post('/sobjects/Opportunity', {
      Name: deal.name,
      Amount: deal.amount,
      StageName: deal.stage,
      CloseDate: deal.closeDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      ...deal.customFields,
    });

    return response.data;
  }

  /**
   * Salesforce - Create task
   */
  private async createSalesforceTask(activity: CRMActivity): Promise<any> {
    const response = await this.client!.post('/sobjects/Task', {
      Subject: activity.subject,
      Description: activity.description,
      ActivityDate: activity.timestamp.toISOString().split('T')[0],
      WhoId: activity.contactId, // Contact/Lead
      WhatId: activity.dealId, // Opportunity
    });

    return response.data;
  }

  /**
   * Map activity type to HubSpot engagement type
   */
  private mapActivityTypeToHubSpot(type: string): string {
    const mapping: Record<string, string> = {
      'call': 'CALL',
      'email': 'EMAIL',
      'meeting': 'MEETING',
      'note': 'NOTE',
    };
    return mapping[type] || 'NOTE';
  }

  /**
   * Get contacts from CRM
   */
  async getContacts(integrationId: string, limit: number = 100): Promise<CRMContact[]> {
    await this.initialize(integrationId);
    const integration = await integrationService.getIntegration(integrationId);

    try {
      let contacts: CRMContact[];

      if (integration.provider === 'hubspot') {
        contacts = await this.getHubSpotContacts(limit);
      } else if (integration.provider === 'salesforce') {
        contacts = await this.getSalesforceContacts(limit);
      } else {
        contacts = [];
      }

      await integrationService.logAction(
        integrationId,
        'get_contacts',
        'success',
        `Retrieved ${contacts.length} contacts`
      );

      return contacts;
    } catch (error) {
      await integrationService.logAction(
        integrationId,
        'get_contacts',
        'error',
        `Failed to get contacts: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Get HubSpot contacts
   */
  private async getHubSpotContacts(limit: number): Promise<CRMContact[]> {
    const response = await this.client!.get('/crm/v3/objects/contacts', {
      params: { limit },
    });

    return response.data.results.map((contact: any) => ({
      id: contact.id,
      email: contact.properties.email,
      firstName: contact.properties.firstname,
      lastName: contact.properties.lastname,
      phone: contact.properties.phone,
      company: contact.properties.company,
    }));
  }

  /**
   * Get Salesforce contacts
   */
  private async getSalesforceContacts(limit: number): Promise<CRMContact[]> {
    const query = `SELECT Id, Email, FirstName, LastName, Phone, Company FROM Lead LIMIT ${limit}`;
    const response = await this.client!.get('/query', {
      params: { q: query },
    });

    return response.data.records.map((lead: any) => ({
      id: lead.Id,
      email: lead.Email,
      firstName: lead.FirstName,
      lastName: lead.LastName,
      phone: lead.Phone,
      company: lead.Company,
    }));
  }
}

export const crmService = new CRMService();
