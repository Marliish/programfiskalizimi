-- Restaurant Features Migration
-- Generated: 2026-02-23
-- Description: Adds table management, kitchen display system, order management, tips & service charge

-- ============================================
-- FLOOR PLANS
-- ============================================
CREATE TABLE IF NOT EXISTS floor_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  layout JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_floor_plans_tenant ON floor_plans(tenant_id);

-- ============================================
-- TABLES
-- ============================================
CREATE TABLE IF NOT EXISTS tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  floor_plan_id UUID REFERENCES floor_plans(id) ON DELETE SET NULL,
  table_number VARCHAR(50) NOT NULL,
  name VARCHAR(255),
  capacity INT DEFAULT 4,
  position_x INT,
  position_y INT,
  width INT DEFAULT 100,
  height INT DEFAULT 100,
  rotation INT DEFAULT 0,
  shape VARCHAR(50) DEFAULT 'rectangle',
  status VARCHAR(50) DEFAULT 'available',
  current_order_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, table_number)
);

CREATE INDEX idx_tables_tenant ON tables(tenant_id);
CREATE INDEX idx_tables_location ON tables(location_id);
CREATE INDEX idx_tables_status ON tables(status);

-- ============================================
-- ORDERS (Restaurant-specific)
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  order_type VARCHAR(50) DEFAULT 'dine_in',
  status VARCHAR(50) DEFAULT 'open',
  guest_count INT DEFAULT 1,
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tip_amount DECIMAL(10,2) DEFAULT 0,
  service_charge DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  is_paid BOOLEAN DEFAULT false,
  split_type VARCHAR(50),
  transaction_id UUID,
  notes TEXT,
  special_requests TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  sent_to_kitchen_at TIMESTAMP,
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP
);

CREATE INDEX idx_orders_tenant ON orders(tenant_id);
CREATE INDEX idx_orders_table ON orders(table_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);

-- ============================================
-- ORDER ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(5,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  subtotal DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  seat_number INT,
  course VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  sent_to_kitchen_at TIMESTAMP,
  ready_at TIMESTAMP,
  served_at TIMESTAMP
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_order_items_status ON order_items(status);

-- ============================================
-- MODIFIERS
-- ============================================
CREATE TABLE IF NOT EXISTS modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  modifier_type VARCHAR(50) NOT NULL,
  price_adjustment DECIMAL(10,2) DEFAULT 0,
  applicable_to_all BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_modifiers_tenant ON modifiers(tenant_id);

-- ============================================
-- ORDER MODIFIERS
-- ============================================
CREATE TABLE IF NOT EXISTS order_modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  modifier_id UUID NOT NULL REFERENCES modifiers(id) ON DELETE RESTRICT,
  modifier_name VARCHAR(255) NOT NULL,
  price_adjustment DECIMAL(10,2) DEFAULT 0
);

CREATE INDEX idx_order_modifiers_item ON order_modifiers(order_item_id);

-- ============================================
-- PRODUCT MODIFIERS MAPPING
-- ============================================
CREATE TABLE IF NOT EXISTS product_modifiers (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  modifier_id UUID NOT NULL REFERENCES modifiers(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, modifier_id)
);

-- ============================================
-- KITCHEN STATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS kitchen_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  station_type VARCHAR(50) NOT NULL,
  display_order INT DEFAULT 0,
  color VARCHAR(50) DEFAULT '#3b82f6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_kitchen_stations_tenant ON kitchen_stations(tenant_id);
CREATE INDEX idx_kitchen_stations_location ON kitchen_stations(location_id);

-- ============================================
-- CATEGORY STATIONS MAPPING
-- ============================================
CREATE TABLE IF NOT EXISTS category_stations (
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES kitchen_stations(id) ON DELETE CASCADE,
  PRIMARY KEY (category_id, station_id)
);

-- ============================================
-- KITCHEN ORDERS
-- ============================================
CREATE TABLE IF NOT EXISTS kitchen_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES kitchen_stations(id) ON DELETE RESTRICT,
  order_number VARCHAR(50) NOT NULL,
  table_number VARCHAR(50),
  items JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  priority INT DEFAULT 0,
  estimated_prep_time INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  ready_at TIMESTAMP,
  served_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_kitchen_orders_tenant ON kitchen_orders(tenant_id);
CREATE INDEX idx_kitchen_orders_order ON kitchen_orders(order_id);
CREATE INDEX idx_kitchen_orders_station ON kitchen_orders(station_id);
CREATE INDEX idx_kitchen_orders_status ON kitchen_orders(status);
CREATE INDEX idx_kitchen_orders_created ON kitchen_orders(created_at);

-- ============================================
-- TIPS
-- ============================================
CREATE TABLE IF NOT EXISTS tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  tip_type VARCHAR(50) NOT NULL,
  is_pooled BOOLEAN DEFAULT false,
  pooled_amount DECIMAL(10,2) DEFAULT 0,
  payment_method VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tips_tenant ON tips(tenant_id);
CREATE INDEX idx_tips_order ON tips(order_id);
CREATE INDEX idx_tips_user ON tips(user_id);
CREATE INDEX idx_tips_created ON tips(created_at);

-- ============================================
-- TIP DISTRIBUTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS tip_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tip_id UUID NOT NULL REFERENCES tips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tip_distributions_tip ON tip_distributions(tip_id);
CREATE INDEX idx_tip_distributions_user ON tip_distributions(user_id);

-- ============================================
-- SERVICE CHARGE RULES
-- ============================================
CREATE TABLE IF NOT EXISTS service_charge_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  charge_type VARCHAR(50) NOT NULL,
  percentage DECIMAL(5,2),
  fixed_amount DECIMAL(10,2),
  min_guest_count INT,
  min_order_amount DECIMAL(10,2),
  time_rules JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_service_charge_rules_tenant ON service_charge_rules(tenant_id);
CREATE INDEX idx_service_charge_rules_location ON service_charge_rules(location_id);

-- ============================================
-- Update trigger for updated_at timestamps
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_floor_plans_updated_at BEFORE UPDATE ON floor_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON tables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_charge_rules_updated_at BEFORE UPDATE ON service_charge_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Completed: Restaurant Features Migration
-- ============================================
