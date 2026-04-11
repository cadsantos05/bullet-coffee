export type OrderStatus =
  | 'pending_payment'
  | 'received'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'cancelled';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  reward_points: number;
  reward_tier_id: string | null;
  notification_orders: boolean;
  notification_promos: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  active: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomizationGroup {
  id: string;
  name: string;
  type: 'single' | 'multi';
  required: boolean;
  sort_order: number;
  created_at: string;
}

export interface CustomizationOption {
  id: string;
  group_id: string;
  name: string;
  price_modifier: number;
  sort_order: number;
  active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  total: number;
  promo_code_id: string | null;
  discount: number;
  pickup_time: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  menu_item_name: string;
  quantity: number;
  unit_price: number;
  customizations: { group: string; option: string; price: number }[];
  item_total: number;
  created_at: string;
}

export interface RewardTier {
  id: string;
  name: string;
  min_points: number;
  multiplier: number;
  perks: string | null;
  created_at: string;
}

export interface Reward {
  id: string;
  name: string;
  description: string | null;
  points_cost: number;
  reward_type: string;
  reward_value: number;
  active: boolean;
  created_at: string;
}

export interface RewardPointsLedger {
  id: string;
  user_id: string;
  points: number;
  reason: string;
  order_id: string | null;
  created_at: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order: number;
  max_uses: number;
  current_uses: number;
  active: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface StoreInfo {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  about: string | null;
  hours: Record<string, { open: string; close: string }>;
  is_open: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  customizations: { group: string; option: string; price: number }[];
  itemTotal: number;
}
