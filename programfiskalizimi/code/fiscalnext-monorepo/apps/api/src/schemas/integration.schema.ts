// Integration Database Schema
import { pgTable, text, timestamp, boolean, integer, jsonb, uuid } from 'drizzle-orm/pg-core';

/**
 * Integrations table - Store integration configurations
 */
export const integrations = pgTable('integrations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  provider: text('provider').notNull(), // 'shopify', 'woocommerce', 'amazon', 'dhl', etc.
  type: text('type').notNull(), // 'ecommerce', 'marketplace', 'shipping', 'crm', 'business', 'custom'
  enabled: boolean('enabled').default(true).notNull(),
  config: jsonb('config').notNull(), // API keys, URLs, etc.
  syncInterval: integer('sync_interval'), // Minutes between auto-syncs
  lastSync: timestamp('last_sync'),
  webhookUrl: text('webhook_url'),
  webhookSecret: text('webhook_secret'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

/**
 * Integration logs - Track integration activities
 */
export const integrationLogs = pgTable('integration_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  integrationId: uuid('integration_id').references(() => integrations.id, { onDelete: 'cascade' }).notNull(),
  action: text('action').notNull(), // 'sync', 'create', 'update', 'error', etc.
  status: text('status').notNull(), // 'success', 'error', 'warning'
  message: text('message').notNull(),
  details: jsonb('details'), // Additional data
  duration: integer('duration'), // Execution time in ms
  createdAt: timestamp('created_at').notNull(),
});

/**
 * Webhooks table - Webhook configurations
 */
export const webhooks = pgTable('webhooks', {
  id: uuid('id').defaultRandom().primaryKey(),
  integrationId: uuid('integration_id').references(() => integrations.id, { onDelete: 'cascade' }).notNull(),
  event: text('event').notNull(), // Event type to listen for
  url: text('url').notNull(), // Webhook URL to call
  secret: text('secret'), // Secret for signature verification
  enabled: boolean('enabled').default(true).notNull(),
  headers: jsonb('headers'), // Custom headers
  retryCount: integer('retry_count').default(3),
  lastTriggered: timestamp('last_triggered'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

/**
 * Webhook events - Track incoming webhook events
 */
export const webhookEvents = pgTable('webhook_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  webhookId: uuid('webhook_id').references(() => webhooks.id, { onDelete: 'set null' }),
  integrationId: uuid('integration_id').references(() => integrations.id, { onDelete: 'cascade' }).notNull(),
  event: text('event').notNull(),
  payload: jsonb('payload').notNull(),
  status: text('status').notNull(), // 'pending', 'processing', 'success', 'failed'
  attempts: integer('attempts').default(0).notNull(),
  error: text('error'),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').notNull(),
});

/**
 * Automation rules - Define automation workflows
 */
export const automationRules = pgTable('automation_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type').notNull(), // 'inventory', 'customer', 'sales', 'notification', 'integration'
  trigger: jsonb('trigger').notNull(), // Trigger configuration
  conditions: jsonb('conditions').notNull(), // Array of conditions
  actions: jsonb('actions').notNull(), // Array of actions to execute
  enabled: boolean('enabled').default(true).notNull(),
  priority: integer('priority').default(5), // Higher = runs first
  lastRun: timestamp('last_run'),
  runCount: integer('run_count').default(0),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

/**
 * Automation logs - Track automation executions
 */
export const automationLogs = pgTable('automation_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  ruleId: uuid('rule_id').references(() => automationRules.id, { onDelete: 'cascade' }).notNull(),
  action: text('action').notNull(),
  status: text('status').notNull(), // 'success', 'error'
  message: text('message').notNull(),
  details: jsonb('details'),
  duration: integer('duration'), // Execution time in ms
  createdAt: timestamp('created_at').notNull(),
});

/**
 * Sync jobs - Track background sync operations
 */
export const syncJobs = pgTable('sync_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  integrationId: uuid('integration_id').references(() => integrations.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(), // 'products', 'orders', 'customers', 'inventory'
  status: text('status').notNull(), // 'pending', 'running', 'completed', 'failed'
  progress: integer('progress').default(0), // Percentage
  total: integer('total'),
  processed: integer('processed').default(0),
  errors: jsonb('errors'), // Array of error messages
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull(),
});

// Export types
export type Integration = typeof integrations.$inferSelect;
export type IntegrationInsert = typeof integrations.$inferInsert;

export type IntegrationLog = typeof integrationLogs.$inferSelect;
export type IntegrationLogInsert = typeof integrationLogs.$inferInsert;

export type Webhook = typeof webhooks.$inferSelect;
export type WebhookInsert = typeof webhooks.$inferInsert;

export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type WebhookEventInsert = typeof webhookEvents.$inferInsert;

export type AutomationRule = typeof automationRules.$inferSelect;
export type AutomationRuleInsert = typeof automationRules.$inferInsert;

export type AutomationLog = typeof automationLogs.$inferSelect;
export type AutomationLogInsert = typeof automationLogs.$inferInsert;

export type SyncJob = typeof syncJobs.$inferSelect;
export type SyncJobInsert = typeof syncJobs.$inferInsert;
