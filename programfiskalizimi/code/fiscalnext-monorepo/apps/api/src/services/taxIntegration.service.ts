// Tax Integration Service - MOCK Albania DGT & Kosovo ATK
// ⚠️ IMPORTANT: This is a MOCK implementation for testing
// Real integration requires actual certificates and credentials

import { prisma } from '@fiscalnext/database';
import crypto from 'crypto';

export class TaxIntegrationService {
  /**
   * Get tax settings for tenant
   */
  async getTaxSettings(tenantId: string, country: 'AL' | 'XK') {
    const settings = await prisma.taxSettings.findUnique({
      where: {
        tenantId_country: {
          tenantId,
          country,
        },
      },
    });

    return settings;
  }

  /**
   * Update tax settings
   */
  async updateTaxSettings(
    tenantId: string,
    country: 'AL' | 'XK',
    data: {
      username?: string;
      password?: string;
      certificate?: string;
      certificatePassword?: string;
      testMode?: boolean;
      integrationEnabled?: boolean;
    }
  ) {
    // Encrypt sensitive data (in production, use proper encryption)
    const encryptedPassword = data.password ? this.encryptData(data.password) : undefined;
    const encryptedCertPassword = data.certificatePassword ? this.encryptData(data.certificatePassword) : undefined;

    const updateData: any = {
      testMode: data.testMode,
      integrationEnabled: data.integrationEnabled,
    };

    if (country === 'AL') {
      if (data.username) updateData.dgtUsername = data.username;
      if (encryptedPassword) updateData.dgtPasswordEncrypted = encryptedPassword;
      if (data.certificate) updateData.dgtCertificate = data.certificate;
      if (encryptedCertPassword) updateData.dgtCertificatePasswordEncrypted = encryptedCertPassword;
    } else {
      if (data.username) updateData.atkUsername = data.username;
      if (encryptedPassword) updateData.atkPasswordEncrypted = encryptedPassword;
      if (data.certificate) updateData.atkCertificate = data.certificate;
      if (encryptedCertPassword) updateData.atkCertificatePasswordEncrypted = encryptedCertPassword;
    }

    // Validate certificate if provided
    if (data.certificate) {
      const certStatus = this.validateCertificate(data.certificate);
      updateData.certificateStatus = certStatus.status;
      updateData.certificateExpiresAt = certStatus.expiresAt;
      updateData.lastVerifiedAt = new Date();
    }

    const settings = await prisma.taxSettings.upsert({
      where: {
        tenantId_country: {
          tenantId,
          country,
        },
      },
      create: {
        tenantId,
        country,
        ...updateData,
      },
      update: updateData,
    });

    return settings;
  }

  /**
   * Test connection to tax authority (MOCK)
   */
  async testConnection(tenantId: string, country: 'AL' | 'XK') {
    const settings = await this.getTaxSettings(tenantId, country);

    if (!settings) {
      throw new Error('Tax settings not configured');
    }

    // MOCK: Simulate connection test
    const isConfigured = country === 'AL' 
      ? !!settings.dgtUsername && !!settings.dgtCertificate
      : !!settings.atkUsername && !!settings.atkCertificate;

    if (!isConfigured) {
      throw new Error('Incomplete configuration. Please provide username and certificate.');
    }

    // MOCK: Simulate random success/failure (90% success rate)
    const success = Math.random() > 0.1;

    if (!success) {
      throw new Error('Connection failed. Please check your credentials and certificate.');
    }

    return {
      success: true,
      message: `Successfully connected to ${country === 'AL' ? 'Albania DGT' : 'Kosovo ATK'} (TEST MODE)`,
      testMode: settings.testMode,
    };
  }

  /**
   * Generate e-invoice XML (mock format)
   */
  async generateEInvoice(tenantId: string, transactionId: string) {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        tenantId,
      },
      include: {
        tenant: true,
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    const country = transaction.tenant.country;
    const iic = this.generateIIC(transaction);
    
    // Generate XML based on country
    const xml = country === 'AL' 
      ? this.generateAlbaniaXML(transaction, iic)
      : this.generateKosovoXML(transaction, iic);

    return {
      xml,
      iic,
      country,
    };
  }

  /**
   * Submit fiscal receipt (MOCK)
   */
  async submitFiscalReceipt(tenantId: string, transactionId: string) {
    // Get or create fiscal receipt
    let fiscalReceipt = await prisma.fiscalReceipt.findUnique({
      where: { transactionId },
    });

    if (!fiscalReceipt) {
      const transaction = await prisma.transaction.findFirst({
        where: { id: transactionId, tenantId },
        include: { tenant: true },
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Generate e-invoice
      const { xml, iic } = await this.generateEInvoice(tenantId, transactionId);

      // MOCK: Generate fiscal number
      const fiscalNumber = this.generateMockFiscalNumber(transaction.tenant.country);

      // Create fiscal receipt
      fiscalReceipt = await prisma.fiscalReceipt.create({
        data: {
          tenantId,
          transactionId,
          country: transaction.tenant.country,
          iic,
          fiscalNumber,
          qrCode: `MOCK-QR-${fiscalNumber}`,
          submissionStatus: 'submitted',
          submittedAt: new Date(),
          responseData: {
            mock: true,
            fiscalNumber,
            submittedAt: new Date().toISOString(),
          },
          verificationStatus: 'verified',
          verifiedAt: new Date(),
        },
      });
    } else if (fiscalReceipt.submissionStatus === 'pending') {
      // Update pending receipt
      const fiscalNumber = this.generateMockFiscalNumber(fiscalReceipt.country);
      
      fiscalReceipt = await prisma.fiscalReceipt.update({
        where: { id: fiscalReceipt.id },
        data: {
          fiscalNumber,
          qrCode: `MOCK-QR-${fiscalNumber}`,
          submissionStatus: 'submitted',
          submittedAt: new Date(),
          responseData: {
            mock: true,
            fiscalNumber,
            submittedAt: new Date().toISOString(),
          },
          verificationStatus: 'verified',
          verifiedAt: new Date(),
        },
      });
    }

    return fiscalReceipt;
  }

  /**
   * Get submission queue (pending receipts)
   */
  async getSubmissionQueue(tenantId: string, limit = 50) {
    const queue = await prisma.fiscalReceipt.findMany({
      where: {
        tenantId,
        submissionStatus: {
          in: ['pending', 'failed'],
        },
      },
      include: {
        transactions: {
          select: {
            id: true,
            transactionNumber: true,
            total: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return queue;
  }

  /**
   * Helper: Validate certificate (MOCK)
   */
  private validateCertificate(certificate: string): { status: string; expiresAt: Date } {
    // MOCK: Just check if it looks like a certificate
    const isValid = certificate.includes('BEGIN CERTIFICATE') || certificate.length > 100;
    
    if (!isValid) {
      return {
        status: 'invalid',
        expiresAt: new Date(),
      };
    }

    // MOCK: Set expiry to 1 year from now
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    return {
      status: 'valid',
      expiresAt,
    };
  }

  /**
   * Helper: Generate IIC (Internal Invoice Code)
   */
  private generateIIC(transaction: any): string {
    const data = JSON.stringify({
      id: transaction.id,
      number: transaction.transactionNumber,
      total: transaction.total,
      date: transaction.createdAt,
    });

    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Helper: Generate mock fiscal number
   */
  private generateMockFiscalNumber(country: string): string {
    const prefix = country === 'AL' ? 'DGT' : 'ATK';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Helper: Generate Albania XML
   */
  private generateAlbaniaXML(transaction: any, iic: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Envelope xmlns="http://www.tatime.gov.al/efiskalizimi/">
  <Header>
    <SendDateTime>${new Date().toISOString()}</SendDateTime>
    <UUID>${transaction.id}</UUID>
  </Header>
  <Body>
    <Invoice>
      <InvoiceNumber>${transaction.transactionNumber}</InvoiceNumber>
      <IIC>${iic}</IIC>
      <TypeOfInvoice>CASH</TypeOfInvoice>
      <IssueDateAndTime>${transaction.createdAt.toISOString()}</IssueDateAndTime>
      <Seller>
        <NIPT>${transaction.tenant.nipt || 'L00000000A'}</NIPT>
        <Name>${transaction.tenant.name}</Name>
        <Address>${transaction.tenant.address || 'Unknown'}</Address>
        <Town>${transaction.tenant.city || 'Tirane'}</Town>
      </Seller>
      <Items>${transaction.items.map((item: any, index: number) => `
        <Item>
          <ItemNumber>${index + 1}</ItemNumber>
          <Name>${item.productName}</Name>
          <Quantity>${item.quantity}</Quantity>
          <UnitPrice>${item.unitPrice}</UnitPrice>
          <PriceAfterVAT>${item.total}</PriceAfterVAT>
          <VATRate>${item.taxRate}</VATRate>
        </Item>`).join('')}
      </Items>
      <SameTaxes>
        <SameTax>
          <VATRate>${transaction.items[0]?.taxRate || 20}</VATRate>
          <PriceBeforeVAT>${transaction.subtotal}</PriceBeforeVAT>
          <VATAmount>${transaction.taxAmount}</VATAmount>
        </SameTax>
      </SameTaxes>
      <TotalPrice>${transaction.total}</TotalPrice>
    </Invoice>
  </Body>
</Envelope>`;
  }

  /**
   * Helper: Generate Kosovo XML
   */
  private generateKosovoXML(transaction: any, iic: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Fiskalizimi xmlns="https://efisc.atk-ks.org/">
  <Koka>
    <DataDergimit>${new Date().toISOString()}</DataDergimit>
    <UUID>${transaction.id}</UUID>
  </Koka>
  <Trupi>
    <Fature>
      <NumriFatures>${transaction.transactionNumber}</NumriFatures>
      <IIC>${iic}</IIC>
      <LlojiFatures>KESH</LlojiFatures>
      <DataLeshimit>${transaction.createdAt.toISOString()}</DataLeshimit>
      <Shitesi>
        <NUI>${transaction.tenant.nipt || '000000000'}</NUI>
        <Emri>${transaction.tenant.name}</Emri>
        <Adresa>${transaction.tenant.address || 'Pa adrese'}</Adresa>
        <Qyteti>${transaction.tenant.city || 'Prishtine'}</Qyteti>
      </Shitesi>
      <Artikujt>${transaction.items.map((item: any, index: number) => `
        <Artikulli>
          <NumriRendor>${index + 1}</NumriRendor>
          <Emri>${item.productName}</Emri>
          <Sasia>${item.quantity}</Sasia>
          <CmimiNjesie>${item.unitPrice}</CmimiNjesie>
          <CmimiTotal>${item.total}</CmimiTotal>
          <NormaTVSH>${item.taxRate}</NormaTVSH>
        </Artikulli>`).join('')}
      </Artikujt>
      <CmimiGjithsej>${transaction.total}</CmimiGjithsej>
    </Fature>
  </Trupi>
</Fiskalizimi>`;
  }

  /**
   * Helper: Encrypt data (simple mock - use proper encryption in production)
   */
  private encryptData(data: string): string {
    return Buffer.from(data).toString('base64');
  }

  /**
   * Helper: Decrypt data (simple mock - use proper encryption in production)
   */
  private decryptData(encrypted: string): string {
    return Buffer.from(encrypted, 'base64').toString('utf-8');
  }
}

export const taxIntegrationService = new TaxIntegrationService();
