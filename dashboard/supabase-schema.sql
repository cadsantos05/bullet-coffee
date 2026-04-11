-- ============================================================
-- Bullet Coffee Co. — Complete Supabase SQL Schema
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 2. CUSTOM TYPES
-- ============================================================
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'pending_payment',
    'received',
    'preparing',
    'ready',
    'picked_up',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 3. TABLES
-- ============================================================

-- Store Info (single-row config)
CREATE TABLE IF NOT EXISTS store_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  phone TEXT,
  email TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  hours JSONB DEFAULT '{}'::jsonb,
  about_text TEXT,
  hero_image_url TEXT,
  logo_url TEXT,
  tax_rate DECIMAL(5,4) NOT NULL DEFAULT 0.1000,
  estimated_prep_minutes INT NOT NULL DEFAULT 10,
  points_per_dollar INT NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles (linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  stripe_customer_id TEXT,
  push_token TEXT,
  notification_orders BOOLEAN NOT NULL DEFAULT true,
  notification_promotions BOOLEAN NOT NULL DEFAULT true,
  total_points INT NOT NULL DEFAULT 0,
  lifetime_points INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin Users
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'barista')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(8,2) NOT NULL,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Customization Groups
CREATE TABLE IF NOT EXISTS customization_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('single_select', 'multi_select')),
  required BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Customization Options
CREATE TABLE IF NOT EXISTS customization_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES customization_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_modifier DECIMAL(8,2) NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Item ↔ Customization Group (many-to-many)
CREATE TABLE IF NOT EXISTS item_customization_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  customization_group_id UUID NOT NULL REFERENCES customization_groups(id) ON DELETE CASCADE,
  UNIQUE (menu_item_id, customization_group_id)
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status order_status NOT NULL DEFAULT 'pending_payment',
  subtotal DECIMAL(8,2) NOT NULL DEFAULT 0,
  tax DECIMAL(8,2) NOT NULL DEFAULT 0,
  discount DECIMAL(8,2) NOT NULL DEFAULT 0,
  total DECIMAL(8,2) NOT NULL DEFAULT 0,
  stripe_payment_intent_id TEXT,
  pickup_time TIMESTAMPTZ,
  estimated_ready_at TIMESTAMPTZ,
  promo_code_id UUID,
  points_earned INT NOT NULL DEFAULT 0,
  points_redeemed INT NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id),
  menu_item_name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(8,2) NOT NULL,
  customizations JSONB NOT NULL DEFAULT '[]'::jsonb,
  item_total DECIMAL(8,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reward Tiers
CREATE TABLE IF NOT EXISTS reward_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  min_points INT NOT NULL DEFAULT 0,
  benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Rewards
CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  points_cost INT NOT NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('free_item', 'discount_percent', 'discount_flat')),
  reward_value DECIMAL(8,2) NOT NULL DEFAULT 0,
  menu_item_id UUID REFERENCES menu_items(id),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reward Points Ledger
CREATE TABLE IF NOT EXISTS reward_points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  points INT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earned', 'redeemed', 'adjusted', 'expired')),
  order_id UUID REFERENCES orders(id),
  reward_id UUID REFERENCES rewards(id),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Promo Codes
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'flat')),
  discount_value DECIMAL(8,2) NOT NULL,
  min_order_amount DECIMAL(8,2) NOT NULL DEFAULT 0,
  max_uses INT,
  used_count INT NOT NULL DEFAULT 0,
  max_uses_per_user INT NOT NULL DEFAULT 1,
  expires_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Promo Code Uses
CREATE TABLE IF NOT EXISTS promo_code_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contact Messages
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. AUTO-CREATE PROFILE TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 5. INDEXES
-- ============================================================

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);

-- menu_items
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_active ON menu_items(active);
CREATE INDEX IF NOT EXISTS idx_menu_items_featured ON menu_items(featured);

-- customization_options
CREATE INDEX IF NOT EXISTS idx_customization_options_group_id ON customization_options(group_id);

-- item_customization_groups
CREATE INDEX IF NOT EXISTS idx_item_cust_groups_menu_item_id ON item_customization_groups(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_item_cust_groups_cust_group_id ON item_customization_groups(customization_group_id);

-- orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_promo_code_id ON orders(promo_code_id);

-- order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON order_items(menu_item_id);

-- reward_points_ledger
CREATE INDEX IF NOT EXISTS idx_reward_points_ledger_user_id ON reward_points_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_points_ledger_order_id ON reward_points_ledger(order_id);
CREATE INDEX IF NOT EXISTS idx_reward_points_ledger_type ON reward_points_ledger(type);

-- rewards
CREATE INDEX IF NOT EXISTS idx_rewards_menu_item_id ON rewards(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_rewards_active ON rewards(active);

-- promo_codes
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(active);

-- promo_code_uses
CREATE INDEX IF NOT EXISTS idx_promo_code_uses_promo_code_id ON promo_code_uses(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_code_uses_user_id ON promo_code_uses(user_id);
CREATE INDEX IF NOT EXISTS idx_promo_code_uses_order_id ON promo_code_uses(order_id);

-- contact_messages
CREATE INDEX IF NOT EXISTS idx_contact_messages_read ON contact_messages(read);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);

-- categories
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(active);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

-- ============================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE store_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customization_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE customization_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_customization_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_uses ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- ----- store_info: public read, service role write -----
CREATE POLICY "store_info_public_read" ON store_info
  FOR SELECT USING (true);
CREATE POLICY "store_info_all_write" ON store_info
  FOR ALL USING (true) WITH CHECK (true);

-- ----- profiles: users read/update own, system insert -----
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_insert_system" ON profiles
  FOR INSERT WITH CHECK (true);

-- ----- admin_users: all access -----
CREATE POLICY "admin_users_all" ON admin_users
  FOR ALL USING (true) WITH CHECK (true);

-- ----- categories: public read, all write -----
CREATE POLICY "categories_public_read" ON categories
  FOR SELECT USING (true);
CREATE POLICY "categories_all_write" ON categories
  FOR ALL USING (true) WITH CHECK (true);

-- ----- menu_items: public read, all write -----
CREATE POLICY "menu_items_public_read" ON menu_items
  FOR SELECT USING (true);
CREATE POLICY "menu_items_all_write" ON menu_items
  FOR ALL USING (true) WITH CHECK (true);

-- ----- customization_groups: public read, all write -----
CREATE POLICY "customization_groups_public_read" ON customization_groups
  FOR SELECT USING (true);
CREATE POLICY "customization_groups_all_write" ON customization_groups
  FOR ALL USING (true) WITH CHECK (true);

-- ----- customization_options: public read, all write -----
CREATE POLICY "customization_options_public_read" ON customization_options
  FOR SELECT USING (true);
CREATE POLICY "customization_options_all_write" ON customization_options
  FOR ALL USING (true) WITH CHECK (true);

-- ----- item_customization_groups: public read, all write -----
CREATE POLICY "item_customization_groups_public_read" ON item_customization_groups
  FOR SELECT USING (true);
CREATE POLICY "item_customization_groups_all_write" ON item_customization_groups
  FOR ALL USING (true) WITH CHECK (true);

-- ----- orders: users read/insert own, service role read/update all -----
CREATE POLICY "orders_select_own" ON orders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "orders_insert_own" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "orders_service_select" ON orders
  FOR SELECT USING (true);
CREATE POLICY "orders_service_update" ON orders
  FOR UPDATE USING (true) WITH CHECK (true);

-- ----- order_items: users read own via order, all insert -----
CREATE POLICY "order_items_select_own" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    )
  );
CREATE POLICY "order_items_service_select" ON order_items
  FOR SELECT USING (true);
CREATE POLICY "order_items_all_insert" ON order_items
  FOR INSERT WITH CHECK (true);

-- ----- reward_tiers: public read, all write -----
CREATE POLICY "reward_tiers_public_read" ON reward_tiers
  FOR SELECT USING (true);
CREATE POLICY "reward_tiers_all_write" ON reward_tiers
  FOR ALL USING (true) WITH CHECK (true);

-- ----- rewards: public read, all write -----
CREATE POLICY "rewards_public_read" ON rewards
  FOR SELECT USING (true);
CREATE POLICY "rewards_all_write" ON rewards
  FOR ALL USING (true) WITH CHECK (true);

-- ----- reward_points_ledger: users read own, all insert -----
CREATE POLICY "reward_points_ledger_select_own" ON reward_points_ledger
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reward_points_ledger_service_select" ON reward_points_ledger
  FOR SELECT USING (true);
CREATE POLICY "reward_points_ledger_all_insert" ON reward_points_ledger
  FOR INSERT WITH CHECK (true);

-- ----- promo_codes: public read active, all write -----
CREATE POLICY "promo_codes_public_read_active" ON promo_codes
  FOR SELECT USING (active = true);
CREATE POLICY "promo_codes_all_write" ON promo_codes
  FOR ALL USING (true) WITH CHECK (true);

-- ----- promo_code_uses: users read own, all insert -----
CREATE POLICY "promo_code_uses_select_own" ON promo_code_uses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "promo_code_uses_service_select" ON promo_code_uses
  FOR SELECT USING (true);
CREATE POLICY "promo_code_uses_all_insert" ON promo_code_uses
  FOR INSERT WITH CHECK (true);

-- ----- contact_messages: public insert, all read/update -----
CREATE POLICY "contact_messages_public_insert" ON contact_messages
  FOR INSERT WITH CHECK (true);
CREATE POLICY "contact_messages_all_read" ON contact_messages
  FOR SELECT USING (true);
CREATE POLICY "contact_messages_all_update" ON contact_messages
  FOR UPDATE USING (true) WITH CHECK (true);

-- ============================================================
-- 7. REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- ============================================================
-- 8. SEED DATA
-- ============================================================

-- ----- Store Info -----
INSERT INTO store_info (name, address, city, state, zip, phone, email, lat, lng, about_text, hero_image_url, logo_url, tax_rate, estimated_prep_minutes, points_per_dollar, hours)
VALUES (
  'Bullet Coffee Co.',
  '2000 Rev Abraham Woods Jr Blvd',
  'Birmingham',
  'AL',
  '35203',
  '(205) 555-0187',
  'hello@bulletcoffee.co',
  33.5186,
  -86.8104,
  'Bullet Coffee Co. is Birmingham''s favorite neighborhood coffee shop. We source our beans from the best roasters and craft every drink with care. Whether you''re grabbing a quick espresso or settling in with a latte, we''re glad you''re here.',
  '/images/hero.jpg',
  '/images/logo.png',
  0.1000,
  10,
  10,
  '{
    "monday":    {"open": "06:00", "close": "20:00"},
    "tuesday":   {"open": "06:00", "close": "20:00"},
    "wednesday": {"open": "06:00", "close": "20:00"},
    "thursday":  {"open": "06:00", "close": "20:00"},
    "friday":    {"open": "06:00", "close": "21:00"},
    "saturday":  {"open": "07:00", "close": "21:00"},
    "sunday":    {"open": "07:00", "close": "18:00"}
  }'::jsonb
);

-- ----- Admin Users -----
-- TODO: Use crypt() with pgcrypto for production
INSERT INTO admin_users (email, password_hash, full_name, role, active) VALUES
  ('admin@bulletcoffee.co',   'admin123',   'Store Admin',  'admin',   true),
  ('barista@bulletcoffee.co', 'barista123', 'Lead Barista', 'barista', true);

-- ----- Categories -----
INSERT INTO categories (id, name, description, image_url, sort_order, active) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Hot Drinks',   'Freshly brewed hot beverages',       '/images/categories/hot-drinks.jpg',  1, true),
  ('a0000000-0000-0000-0000-000000000002', 'Cold Drinks',  'Refreshing cold beverages',          '/images/categories/cold-drinks.jpg', 2, true),
  ('a0000000-0000-0000-0000-000000000003', 'Pastries',     'Freshly baked pastries and treats',  '/images/categories/pastries.jpg',    3, true),
  ('a0000000-0000-0000-0000-000000000004', 'Sandwiches',   'Hearty sandwiches and wraps',        '/images/categories/sandwiches.jpg',  4, true),
  ('a0000000-0000-0000-0000-000000000005', 'Extras',       'Add-ons and extras',                 '/images/categories/extras.jpg',      5, true);

-- ----- Customization Groups (fixed UUIDs) -----
INSERT INTO customization_groups (id, name, type, required, sort_order) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Size',        'single_select', true,  1),
  ('c0000000-0000-0000-0000-000000000002', 'Milk',        'single_select', true,  2),
  ('c0000000-0000-0000-0000-000000000003', 'Extras',      'multi_select',  false, 3),
  ('c0000000-0000-0000-0000-000000000004', 'Sugar Level', 'single_select', true,  4);

-- ----- Customization Options -----

-- Size options
INSERT INTO customization_options (group_id, name, price_modifier, is_default, sort_order, active) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Small (12oz)',  0.00, true,  1, true),
  ('c0000000-0000-0000-0000-000000000001', 'Medium (16oz)', 0.50, false, 2, true),
  ('c0000000-0000-0000-0000-000000000001', 'Large (20oz)',  1.00, false, 3, true);

-- Milk options
INSERT INTO customization_options (group_id, name, price_modifier, is_default, sort_order, active) VALUES
  ('c0000000-0000-0000-0000-000000000002', 'Whole Milk',   0.00, true,  1, true),
  ('c0000000-0000-0000-0000-000000000002', '2% Milk',      0.00, false, 2, true),
  ('c0000000-0000-0000-0000-000000000002', 'Oat Milk',     0.75, false, 3, true),
  ('c0000000-0000-0000-0000-000000000002', 'Almond Milk',  0.75, false, 4, true),
  ('c0000000-0000-0000-0000-000000000002', 'Coconut Milk', 0.75, false, 5, true),
  ('c0000000-0000-0000-0000-000000000002', 'No Milk',      0.00, false, 6, true);

-- Extras options
INSERT INTO customization_options (group_id, name, price_modifier, is_default, sort_order, active) VALUES
  ('c0000000-0000-0000-0000-000000000003', 'Extra Shot',        0.75, false, 1, true),
  ('c0000000-0000-0000-0000-000000000003', 'Vanilla Syrup',     0.50, false, 2, true),
  ('c0000000-0000-0000-0000-000000000003', 'Caramel Syrup',     0.50, false, 3, true),
  ('c0000000-0000-0000-0000-000000000003', 'Hazelnut Syrup',    0.50, false, 4, true),
  ('c0000000-0000-0000-0000-000000000003', 'Whipped Cream',     0.50, false, 5, true),
  ('c0000000-0000-0000-0000-000000000003', 'Chocolate Drizzle', 0.50, false, 6, true);

-- Sugar Level options
INSERT INTO customization_options (group_id, name, price_modifier, is_default, sort_order, active) VALUES
  ('c0000000-0000-0000-0000-000000000004', 'No Sugar',    0.00, false, 1, true),
  ('c0000000-0000-0000-0000-000000000004', 'Light Sugar', 0.00, false, 2, true),
  ('c0000000-0000-0000-0000-000000000004', 'Regular',     0.00, true,  3, true),
  ('c0000000-0000-0000-0000-000000000004', 'Extra Sugar', 0.00, false, 4, true);

-- ----- Menu Items -----

-- Hot Drinks
INSERT INTO menu_items (id, category_id, name, description, price, image_url, active, featured, sort_order) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Americano',  'Rich espresso with hot water for a smooth, bold flavor',  3.50, '/images/menu/americano.jpg',  true, true,  1),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Latte',      'Creamy espresso with steamed milk',                       4.50, '/images/menu/latte.jpg',      true, true,  2),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Cappuccino', 'Espresso with equal parts steamed and frothed milk',      4.50, '/images/menu/cappuccino.jpg', true, false, 3),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Mocha',      'Espresso with chocolate and steamed milk, topped with whipped cream', 5.00, '/images/menu/mocha.jpg', true, true, 4),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Espresso',   'A bold, concentrated shot of pure coffee',                3.00, '/images/menu/espresso.jpg',   true, false, 5);

-- Cold Drinks
INSERT INTO menu_items (id, category_id, name, description, price, image_url, active, featured, sort_order) VALUES
  ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000002', 'Iced Latte', 'Chilled espresso with cold milk over ice',               5.00, '/images/menu/iced-latte.jpg', true, true,  1),
  ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000002', 'Cold Brew',  'Slow-steeped for 20 hours for an ultra-smooth taste',    4.50, '/images/menu/cold-brew.jpg',  true, true,  2),
  ('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000002', 'Iced Mocha', 'Iced espresso with chocolate, milk, and whipped cream',  5.50, '/images/menu/iced-mocha.jpg', true, false, 3),
  ('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000002', 'Refresher',  'A fruity, caffeine-infused refresher',                   4.00, '/images/menu/refresher.jpg',  true, false, 4);

-- Pastries
INSERT INTO menu_items (id, category_id, name, description, price, image_url, active, featured, sort_order) VALUES
  ('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000003', 'Croissant',             'Buttery, flaky French-style croissant',           3.50, '/images/menu/croissant.jpg',   true, true,  1),
  ('b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000003', 'Blueberry Muffin',      'Moist muffin loaded with fresh blueberries',      3.00, '/images/menu/blueberry-muffin.jpg', true, false, 2),
  ('b0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000003', 'Chocolate Chip Cookie', 'Warm, gooey chocolate chip cookie',               2.50, '/images/menu/choc-chip-cookie.jpg', true, false, 3),
  ('b0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000003', 'Banana Bread',          'Homestyle banana bread with walnuts',             3.50, '/images/menu/banana-bread.jpg', true, false, 4);

-- Sandwiches
INSERT INTO menu_items (id, category_id, name, description, price, image_url, active, featured, sort_order) VALUES
  ('b0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000004', 'Turkey Club',    'Sliced turkey, bacon, lettuce, tomato on toasted sourdough', 8.50, '/images/menu/turkey-club.jpg',   true, true,  1),
  ('b0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000004', 'BLT',            'Classic bacon, lettuce, and tomato sandwich',               7.50, '/images/menu/blt.jpg',           true, false, 2),
  ('b0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000004', 'Grilled Cheese', 'Melted cheddar and gouda on buttered sourdough',            6.50, '/images/menu/grilled-cheese.jpg', true, false, 3),
  ('b0000000-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000004', 'Veggie Wrap',    'Fresh veggies with hummus in a spinach tortilla',           7.00, '/images/menu/veggie-wrap.jpg',   true, false, 4);

-- Extras
INSERT INTO menu_items (id, category_id, name, description, price, image_url, active, featured, sort_order) VALUES
  ('b0000000-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000005', 'Bottled Water',       'Purified spring water',          2.00, '/images/menu/water.jpg',        true, false, 1),
  ('b0000000-0000-0000-0000-000000000019', 'a0000000-0000-0000-0000-000000000005', 'Orange Juice',        'Freshly squeezed orange juice',  3.50, '/images/menu/orange-juice.jpg', true, false, 2),
  ('b0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000005', 'Extra Espresso Shot', 'Add an extra shot to any drink',  1.50, '/images/menu/extra-shot.jpg',   true, false, 3),
  ('b0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000005', 'Cookie Add-on',       'Add a fresh-baked cookie',       2.00, '/images/menu/cookie-addon.jpg', true, false, 4);

-- ----- Item ↔ Customization Group Links -----

-- Hot Drinks → all 4 customization groups
INSERT INTO item_customization_groups (menu_item_id, customization_group_id) VALUES
  -- Americano
  ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002'),
  ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003'),
  ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004'),
  -- Latte
  ('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002'),
  ('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003'),
  ('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000004'),
  -- Cappuccino
  ('b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002'),
  ('b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003'),
  ('b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000004'),
  -- Mocha
  ('b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002'),
  ('b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000003'),
  ('b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004'),
  -- Espresso
  ('b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002'),
  ('b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000003'),
  ('b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000004');

-- Cold Drinks → all 4 customization groups
INSERT INTO item_customization_groups (menu_item_id, customization_group_id) VALUES
  -- Iced Latte
  ('b0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000002'),
  ('b0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000003'),
  ('b0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000004'),
  -- Cold Brew
  ('b0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000002'),
  ('b0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000003'),
  ('b0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000004'),
  -- Iced Mocha
  ('b0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000002'),
  ('b0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000003'),
  ('b0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000004'),
  -- Refresher
  ('b0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000002'),
  ('b0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000003'),
  ('b0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000004');

-- Pastries → Size group only
INSERT INTO item_customization_groups (menu_item_id, customization_group_id) VALUES
  ('b0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000001');

-- Sandwiches → Size group only
INSERT INTO item_customization_groups (menu_item_id, customization_group_id) VALUES
  ('b0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000016', 'c0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000017', 'c0000000-0000-0000-0000-000000000001');

-- Extras → no customization groups (nothing to insert)

-- ----- Reward Tiers -----
INSERT INTO reward_tiers (name, min_points, benefits, sort_order) VALUES
  ('Bronze', 0,    '["Earn 10 points per dollar", "Birthday reward"]'::jsonb, 1),
  ('Silver', 500,  '["Earn 12 points per dollar", "Birthday reward", "Free size upgrade", "Early access to new items"]'::jsonb, 2),
  ('Gold',   1500, '["Earn 15 points per dollar", "Birthday reward", "Free size upgrade", "Early access to new items", "Free drink every month", "Priority pickup"]'::jsonb, 3);

-- ----- Rewards -----
INSERT INTO rewards (name, description, points_cost, reward_type, reward_value, menu_item_id, active) VALUES
  ('Free Medium Coffee', 'Redeem for any medium hot or iced coffee',   150, 'free_item',        0.00, 'b0000000-0000-0000-0000-000000000001', true),
  ('Free Pastry',        'Redeem for any pastry of your choice',       200, 'free_item',        0.00, 'b0000000-0000-0000-0000-000000000010', true),
  ('$2 Off Any Order',   'Get $2 off your next order',                 100, 'discount_flat',    2.00, NULL, true),
  ('15% Off Any Order',  'Get 15% off your entire order',              250, 'discount_percent', 15.00, NULL, true),
  ('Free Large Specialty','Redeem for any large specialty drink',       350, 'free_item',        0.00, 'b0000000-0000-0000-0000-000000000004', true);

-- ============================================================
-- 12. STORAGE BUCKETS
-- ============================================================

-- Create 3 public buckets for images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('menu-images', 'menu-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('category-images', 'category-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('store-images', 'store-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

-- Storage policies: anyone can VIEW images (public buckets)
CREATE POLICY "Public read menu-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'menu-images');

CREATE POLICY "Public read category-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'category-images');

CREATE POLICY "Public read store-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'store-images');

-- Storage policies: authenticated users can UPLOAD images
CREATE POLICY "Authenticated upload menu-images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'menu-images');

CREATE POLICY "Authenticated upload category-images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'category-images');

CREATE POLICY "Authenticated upload store-images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'store-images');

-- Storage policies: authenticated users can UPDATE images
CREATE POLICY "Authenticated update menu-images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'menu-images');

CREATE POLICY "Authenticated update category-images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'category-images');

CREATE POLICY "Authenticated update store-images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'store-images');

-- Storage policies: authenticated users can DELETE images
CREATE POLICY "Authenticated delete menu-images" ON storage.objects
  FOR DELETE USING (bucket_id = 'menu-images');

CREATE POLICY "Authenticated delete category-images" ON storage.objects
  FOR DELETE USING (bucket_id = 'category-images');

CREATE POLICY "Authenticated delete store-images" ON storage.objects
  FOR DELETE USING (bucket_id = 'store-images');

-- ============================================================
-- DONE! Bullet Coffee Co. schema is ready.
-- Run this SQL, then check:
--   1. Tables: 16 tables created with seed data
--   2. Storage: 3 buckets (menu-images, category-images, store-images)
--   3. Realtime: orders table enabled
-- ============================================================
