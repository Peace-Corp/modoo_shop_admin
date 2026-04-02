export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  stock: number;
  sort_order: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number | null;
  images: string[];
  brand_id: string;
  category: string;
  stock: number;
  rating?: number | null;
  review_count?: number | null;
  tags?: string[] | null;
  featured?: boolean | null;
  size_chart_image?: string | null;
  description_image?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  product_variants?: ProductVariant[];
}

export interface Brand {
  id: string;
  name: string;
  eng_name?: string | null;
  slug: string;
  logo: string;
  banner: string;
  brand_color?: string | null;
  description: string;
  featured?: boolean | null;
  order_detail_image?: (string | string[])[] | null;
  valid_period_start?: string | null;
  valid_period_end?: string | null;
  delivery_domestic_enabled: boolean;
  delivery_domestic_price: number;
  delivery_international_enabled: boolean;
  delivery_international_price: number;
  delivery_pickup_enabled: boolean;
  delivery_pickup_price: number;
  delivery_pickup_address?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface BrandHeroBanner {
  id: string;
  brand_id: string;
  image_link: string;
  title: string;
  subtitle: string | null;
  link: string | null;
  color: string | null;
  display_order: number | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Order {
  id: string;
  user_id: string | null;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_method: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
  shipping_address_line_one: string;
  shipping_address_line_two?: string | null;
  shipping_city?: string | null;
  shipping_state?: string | null;
  shipping_zip_code: string;
  shipping_country?: string | null;
  customer_phone: string;
  customer_name?: string | null;
  customer_email?: string | null;
  order_name?: string | null;
  payment_id?: string | null;
  delivery_method: string;
  shipping_cost: number;
  refund_amount: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id?: string | null;
  size?: string | null;
  quantity: number;
  price_at_time: number;
  created_at?: string | null;
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  role: 'user' | 'admin';
  created_at?: string | null;
  updated_at?: string | null;
}

export interface SalesData {
  id: string;
  date: string;
  revenue: number;
  orders: number;
  created_at?: string | null;
}

export interface RefundedItem {
  order_item_id: string;
  product_name: string;
  quantity: number;
  amount: number;
}

export interface Refund {
  id: string;
  order_id: string;
  refund_type: 'full' | 'partial';
  refund_amount: number;
  reason: string;
  status: 'pending' | 'completed' | 'rejected';
  refunded_items?: RefundedItem[] | null;
  admin_note?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface DailyOrderStats {
  date: string;
  orderCount: number;
  totalAmount: number;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalOrderAmount: number;
  totalProducts: number;
  totalBrands: number;
  recentOrders: Order[];
  salesData: SalesData[];
  dailyOrderStats: DailyOrderStats[];
}
