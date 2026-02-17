export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          country: string
          created_at: string | null
          id: string
          is_default: boolean | null
          phone: string
          state: string
          street: string
          updated_at: string | null
          user_id: string
          zip_code: string
        }
        Insert: {
          city: string
          country: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          phone: string
          state: string
          street: string
          updated_at?: string | null
          user_id: string
          zip_code: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          phone?: string
          state?: string
          street?: string
          updated_at?: string | null
          user_id?: string
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          banner: string
          created_at: string | null
          description: string
          eng_name: string | null
          featured: boolean | null
          id: string
          logo: string
          name: string
          order_detail_image: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          banner: string
          created_at?: string | null
          description: string
          eng_name?: string | null
          featured?: boolean | null
          id: string
          logo: string
          name: string
          order_detail_image?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          banner?: string
          created_at?: string | null
          description?: string
          eng_name?: string | null
          featured?: boolean | null
          id?: string
          logo?: string
          name?: string
          order_detail_image?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      brand_hero_banners: {
        Row: {
          brand_id: string
          color: string | null
          created_at: string | null
          display_order: number | null
          id: string
          image_link: string
          is_active: boolean | null
          link: string | null
          subtitle: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          brand_id: string
          color?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_link: string
          is_active?: boolean | null
          link?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          brand_id?: string
          color?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_link?: string
          is_active?: boolean | null
          link?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_hero_banners_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      hero_banners: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          image_link: string
          is_active: boolean | null
          link: string | null
          subtitle: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_link: string
          is_active?: boolean | null
          link?: string | null
          subtitle?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_link?: string
          is_active?: boolean | null
          link?: string | null
          subtitle?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          price_at_time: number
          product_id: string
          quantity: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          price_at_time: number
          product_id: string
          quantity: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          price_at_time?: number
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          id: string
          payment_method: string
          payment_status: string
          shipping_city: string
          shipping_country: string
          shipping_phone: string
          shipping_state: string
          shipping_street: string
          shipping_zip_code: string
          status: string
          total: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          payment_method: string
          payment_status?: string
          shipping_city: string
          shipping_country: string
          shipping_phone: string
          shipping_state: string
          shipping_street: string
          shipping_zip_code: string
          status?: string
          total: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          payment_method?: string
          payment_status?: string
          shipping_city?: string
          shipping_country?: string
          shipping_phone?: string
          shipping_state?: string
          shipping_street?: string
          shipping_zip_code?: string
          status?: string
          total?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          size: string
          sort_order: number | null
          stock: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          size: string
          sort_order?: number | null
          stock?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          size?: string
          sort_order?: number | null
          stock?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand_id: string
          category: string
          created_at: string | null
          description: string
          featured: boolean | null
          id: string
          images: string[]
          name: string
          original_price: number | null
          price: number
          rating: number | null
          review_count: number | null
          stock: number
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          brand_id: string
          category: string
          created_at?: string | null
          description: string
          featured?: boolean | null
          id?: string
          images?: string[]
          name: string
          original_price?: number | null
          price: number
          rating?: number | null
          review_count?: number | null
          stock?: number
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          brand_id?: string
          category?: string
          created_at?: string | null
          description?: string
          featured?: boolean | null
          id?: string
          images?: string[]
          name?: string
          original_price?: number | null
          price?: number
          rating?: number | null
          review_count?: number | null
          stock?: number
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar?: string | null
          created_at?: string | null
          email: string
          id: string
          name: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          avatar?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sales_data: {
        Row: {
          created_at: string | null
          date: string
          id: string
          orders: number
          revenue: number
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          orders?: number
          revenue?: number
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          orders?: number
          revenue?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
