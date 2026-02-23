// Google Workspace Integration Service - Calendar, Drive, Sheets
import axios, { AxiosInstance } from 'axios';
import { integrationService } from './integration.service';

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  attendees?: string[];
  location?: string;
}

export interface DriveFile {
  id?: string;
  name: string;
  mimeType: string;
  content?: string | Buffer;
  parents?: string[];
}

export interface SheetData {
  range: string;
  values: any[][];
}

export class GoogleWorkspaceService {
  private client: AxiosInstance | null = null;

  /**
   * Initialize Google API client
   */
  async initialize(integrationId: string): Promise<void> {
    const integration = await integrationService.getIntegration(integrationId);
    if (!integration) {
      throw new Error('Integration not found');
    }

    const config = integration.config;

    this.client = axios.create({
      baseURL: 'https://www.googleapis.com',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Create calendar event
   */
  async createCalendarEvent(
    integrationId: string,
    calendarId: string,
    event: CalendarEvent
  ): Promise<any> {
    await this.initialize(integrationId);

    try {
      const response = await this.client!.post(
        `/calendar/v3/calendars/${calendarId}/events`,
        {
          summary: event.summary,
          description: event.description,
          start: {
            dateTime: event.start.toISOString(),
            timeZone: 'Europe/Tirane',
          },
          end: {
            dateTime: event.end.toISOString(),
            timeZone: 'Europe/Tirane',
          },
          attendees: event.attendees?.map(email => ({ email })),
          location: event.location,
        }
      );

      await integrationService.logAction(
        integrationId,
        'create_calendar_event',
        'success',
        `Calendar event created: ${event.summary}`,
        { eventId: response.data.id }
      );

      return response.data;
    } catch (error) {
      await integrationService.logAction(
        integrationId,
        'create_calendar_event',
        'error',
        `Failed to create calendar event: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Get calendar events
   */
  async getCalendarEvents(
    integrationId: string,
    calendarId: string,
    timeMin: Date,
    timeMax: Date
  ): Promise<CalendarEvent[]> {
    await this.initialize(integrationId);

    try {
      const response = await this.client!.get(
        `/calendar/v3/calendars/${calendarId}/events`,
        {
          params: {
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
          },
        }
      );

      const events = response.data.items.map((item: any) => ({
        id: item.id,
        summary: item.summary,
        description: item.description,
        start: new Date(item.start.dateTime || item.start.date),
        end: new Date(item.end.dateTime || item.end.date),
        attendees: item.attendees?.map((a: any) => a.email),
        location: item.location,
      }));

      await integrationService.logAction(
        integrationId,
        'get_calendar_events',
        'success',
        `Retrieved ${events.length} calendar events`
      );

      return events;
    } catch (error) {
      await integrationService.logAction(
        integrationId,
        'get_calendar_events',
        'error',
        `Failed to get calendar events: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Upload file to Drive
   */
  async uploadToDrive(
    integrationId: string,
    file: DriveFile
  ): Promise<any> {
    await this.initialize(integrationId);

    try {
      // First, create file metadata
      const metadataResponse = await this.client!.post(
        '/upload/drive/v3/files?uploadType=resumable',
        {
          name: file.name,
          mimeType: file.mimeType,
          parents: file.parents,
        }
      );

      const uploadUrl = metadataResponse.headers['location'];

      // Upload file content
      if (file.content) {
        await axios.put(uploadUrl, file.content, {
          headers: {
            'Content-Type': file.mimeType,
          },
        });
      }

      await integrationService.logAction(
        integrationId,
        'upload_to_drive',
        'success',
        `File uploaded: ${file.name}`
      );

      return metadataResponse.data;
    } catch (error) {
      await integrationService.logAction(
        integrationId,
        'upload_to_drive',
        'error',
        `Failed to upload file: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Backup reports to Drive
   */
  async backupReportsToDrive(
    integrationId: string,
    reports: Array<{ name: string; data: any }>,
    folderId: string
  ): Promise<{ uploaded: number; errors: string[] }> {
    await this.initialize(integrationId);

    const results = { uploaded: 0, errors: [] };

    for (const report of reports) {
      try {
        const content = JSON.stringify(report.data, null, 2);
        
        await this.uploadToDrive(integrationId, {
          name: `${report.name}_${new Date().toISOString().split('T')[0]}.json`,
          mimeType: 'application/json',
          content,
          parents: [folderId],
        });

        results.uploaded++;
      } catch (error) {
        results.errors.push(`${report.name}: ${error.message}`);
      }
    }

    await integrationService.logAction(
      integrationId,
      'backup_reports',
      results.errors.length === 0 ? 'success' : 'warning',
      `Backed up ${results.uploaded}/${reports.length} reports`,
      results
    );

    return results;
  }

  /**
   * Export data to Google Sheets
   */
  async exportToSheets(
    integrationId: string,
    spreadsheetId: string,
    data: SheetData
  ): Promise<void> {
    await this.initialize(integrationId);

    try {
      await this.client!.put(
        `/sheets/v4/spreadsheets/${spreadsheetId}/values/${data.range}`,
        {
          range: data.range,
          values: data.values,
        },
        {
          params: {
            valueInputOption: 'RAW',
          },
        }
      );

      await integrationService.logAction(
        integrationId,
        'export_to_sheets',
        'success',
        `Data exported to sheet: ${data.range}`
      );
    } catch (error) {
      await integrationService.logAction(
        integrationId,
        'export_to_sheets',
        'error',
        `Failed to export to sheets: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Sync sales data to Sheets (real-time)
   */
  async syncSalesToSheets(
    integrationId: string,
    spreadsheetId: string,
    sales: Array<{
      date: Date;
      orderId: string;
      total: number;
      items: number;
      customer?: string;
    }>
  ): Promise<void> {
    const values = [
      ['Date', 'Order ID', 'Total', 'Items', 'Customer'], // Header
      ...sales.map(sale => [
        sale.date.toISOString(),
        sale.orderId,
        sale.total,
        sale.items,
        sale.customer || 'Walk-in',
      ]),
    ];

    await this.exportToSheets(integrationId, spreadsheetId, {
      range: 'Sales!A1',
      values,
    });
  }

  /**
   * Sync inventory to Sheets
   */
  async syncInventoryToSheets(
    integrationId: string,
    spreadsheetId: string,
    inventory: Array<{
      sku: string;
      name: string;
      quantity: number;
      price: number;
      category: string;
    }>
  ): Promise<void> {
    const values = [
      ['SKU', 'Product Name', 'Quantity', 'Price', 'Category'], // Header
      ...inventory.map(item => [
        item.sku,
        item.name,
        item.quantity,
        item.price,
        item.category,
      ]),
    ];

    await this.exportToSheets(integrationId, spreadsheetId, {
      range: 'Inventory!A1',
      values,
    });
  }

  /**
   * Create appointment/booking in Calendar
   */
  async createBooking(
    integrationId: string,
    calendarId: string,
    booking: {
      customerName: string;
      customerEmail: string;
      service: string;
      startTime: Date;
      duration: number; // minutes
      notes?: string;
    }
  ): Promise<any> {
    const endTime = new Date(booking.startTime.getTime() + booking.duration * 60000);

    return await this.createCalendarEvent(integrationId, calendarId, {
      summary: `${booking.service} - ${booking.customerName}`,
      description: `
Service: ${booking.service}
Customer: ${booking.customerName}
Email: ${booking.customerEmail}
${booking.notes ? `\nNotes: ${booking.notes}` : ''}
      `.trim(),
      start: booking.startTime,
      end: endTime,
      attendees: [booking.customerEmail],
    });
  }

  /**
   * Get Drive folder contents
   */
  async listDriveFiles(
    integrationId: string,
    folderId?: string
  ): Promise<DriveFile[]> {
    await this.initialize(integrationId);

    try {
      const query = folderId ? `'${folderId}' in parents` : undefined;
      
      const response = await this.client!.get('/drive/v3/files', {
        params: {
          q: query,
          fields: 'files(id,name,mimeType,parents)',
        },
      });

      return response.data.files.map((file: any) => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        parents: file.parents,
      }));
    } catch (error) {
      throw new Error(`Failed to list Drive files: ${error.message}`);
    }
  }
}

export const googleWorkspaceService = new GoogleWorkspaceService();
