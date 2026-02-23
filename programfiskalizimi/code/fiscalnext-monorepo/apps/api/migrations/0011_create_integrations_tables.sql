-- Day 11: Create Integrations & Automation Tables
-- Created: 2026-02-23

-- Integrations table
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ecommerce', 'marketplace', 'shipping', 'crm', 'business', 'custom')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}',
  sync_interval INTEGER,
  last_sync TIMESTAMP,
  webhook_url TEXT,
  webhook_secret TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_integrations_provider ON integrations(provider);
CREATE INDEX idx_integrations_type ON integrations(type);
CREATE INDEX idx_integrations_enabled ON integrations(enabled);

-- Integration logs table
CREATE TABLE IF NOT EXISTS integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'warning')),
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  duration INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_integration_logs_integration_id ON integration_logs(integration_id);
CREATE INDEX idx_integration_logs_status ON integration_logs(status);
CREATE INDEX idx_integration_logs_created_at ON integration_logs(created_at DESC);

-- Webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  headers JSONB DEFAULT '{}',
  retry_count INTEGER DEFAULT 3,
  last_triggered TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhooks_integration_id ON webhooks(integration_id);
CREATE INDEX idx_webhooks_event ON webhooks(event);
CREATE INDEX idx_webhooks_enabled ON webhooks(enabled);

-- Webhook events table
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES webhooks(id) ON DELETE SET NULL,
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'success', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  processed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_integration_id ON webhook_events(integration_id);
CREATE INDEX idx_webhook_events_status ON webhook_events(status);
CREATE INDEX idx_webhook_events_created_at ON webhook_events(created_at DESC);

-- Automation rules table
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('inventory', 'customer', 'sales', 'notification', 'integration')),
  trigger JSONB NOT NULL DEFAULT '{}',
  conditions JSONB NOT NULL DEFAULT '[]',
  actions JSONB NOT NULL DEFAULT '[]',
  enabled BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER DEFAULT 5,
  last_run TIMESTAMP,
  run_count INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_automation_rules_type ON automation_rules(type);
CREATE INDEX idx_automation_rules_enabled ON automation_rules(enabled);
CREATE INDEX idx_automation_rules_priority ON automation_rules(priority DESC);

-- Automation logs table
CREATE TABLE IF NOT EXISTS automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  duration INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_automation_logs_rule_id ON automation_logs(rule_id);
CREATE INDEX idx_automation_logs_status ON automation_logs(status);
CREATE INDEX idx_automation_logs_created_at ON automation_logs(created_at DESC);

-- Sync jobs table
CREATE TABLE IF NOT EXISTS sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  total INTEGER,
  processed INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sync_jobs_integration_id ON sync_jobs(integration_id);
CREATE INDEX idx_sync_jobs_status ON sync_jobs(status);
CREATE INDEX idx_sync_jobs_created_at ON sync_jobs(created_at DESC);

-- Comments
COMMENT ON TABLE integrations IS 'Third-party integration configurations';
COMMENT ON TABLE integration_logs IS 'Integration activity logs';
COMMENT ON TABLE webhooks IS 'Webhook configurations for integrations';
COMMENT ON TABLE webhook_events IS 'Incoming webhook events tracking';
COMMENT ON TABLE automation_rules IS 'Automation workflow rules';
COMMENT ON TABLE automation_logs IS 'Automation execution logs';
COMMENT ON TABLE sync_jobs IS 'Background sync job tracking';

-- Grant permissions (adjust as needed)
-- GRANT ALL ON integrations TO fiscalnext_api;
-- GRANT ALL ON integration_logs TO fiscalnext_api;
-- GRANT ALL ON webhooks TO fiscalnext_api;
-- GRANT ALL ON webhook_events TO fiscalnext_api;
-- GRANT ALL ON automation_rules TO fiscalnext_api;
-- GRANT ALL ON automation_logs TO fiscalnext_api;
-- GRANT ALL ON sync_jobs TO fiscalnext_api;
