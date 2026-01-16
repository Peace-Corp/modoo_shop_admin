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
  description: string;
  featured?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Order {
  id: string;
  user_id: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_method: string;
  payment_status: 'pending' | 'completed' | 'failed';
  shipping_street: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip_code: string;
  shipping_country: string;
  shipping_phone: string;
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

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalBrands: number;
  recentOrders: Order[];
  salesData: SalesData[];
}
