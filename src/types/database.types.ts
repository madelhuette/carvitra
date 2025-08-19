export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      credit_offers: {
        Row: {
          created_at: string | null
          credit_type: string | null
          down_payment: number | null
          duration_months: number | null
          final_rate: number | null
          id: string
          institution_name: string | null
          interest_rate: number | null
          km_per_year: number | null
          monthly_rate: number | null
          offer_id: string
          terms: Json | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credit_type?: string | null
          down_payment?: number | null
          duration_months?: number | null
          final_rate?: number | null
          id?: string
          institution_name?: string | null
          interest_rate?: number | null
          km_per_year?: number | null
          monthly_rate?: number | null
          offer_id: string
          terms?: Json | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credit_type?: string | null
          down_payment?: number | null
          duration_months?: number | null
          final_rate?: number | null
          id?: string
          institution_name?: string | null
          interest_rate?: number | null
          km_per_year?: number | null
          monthly_rate?: number | null
          offer_id?: string
          terms?: Json | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_offers_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          category: string
          created_at: string | null
          display_order: number | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      fuel_types: {
        Row: {
          display_order: number | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          display_order?: number | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      offer_equipment: {
        Row: {
          equipment_id: string
          offer_id: string
        }
        Insert: {
          equipment_id: string
          offer_id: string
        }
        Update: {
          equipment_id?: string
          offer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_equipment_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_equipment_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          created_at: string | null
          description: string | null
          first_registration: string | null
          fuel_type_id: string | null
          id: string
          images: Json | null
          make: string | null
          mileage: number | null
          model: string | null
          organization_id: string
          pdf_url: string | null
          price_monthly: number | null
          price_purchase: number | null
          published_at: string | null
          slug: string | null
          status: string | null
          title: string
          transmission_type_id: string | null
          updated_at: string | null
          variant: string | null
          vehicle_data: Json | null
          vehicle_type_id: string | null
          year: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          first_registration?: string | null
          fuel_type_id?: string | null
          id?: string
          images?: Json | null
          make?: string | null
          mileage?: number | null
          model?: string | null
          organization_id: string
          pdf_url?: string | null
          price_monthly?: number | null
          price_purchase?: number | null
          published_at?: string | null
          slug?: string | null
          status?: string | null
          title: string
          transmission_type_id?: string | null
          updated_at?: string | null
          variant?: string | null
          vehicle_data?: Json | null
          vehicle_type_id?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          first_registration?: string | null
          fuel_type_id?: string | null
          id?: string
          images?: Json | null
          make?: string | null
          mileage?: number | null
          model?: string | null
          organization_id?: string
          pdf_url?: string | null
          price_monthly?: number | null
          price_purchase?: number | null
          published_at?: string | null
          slug?: string | null
          status?: string | null
          title?: string
          transmission_type_id?: string | null
          updated_at?: string | null
          variant?: string | null
          vehicle_data?: Json | null
          vehicle_type_id?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_fuel_type_id_fkey"
            columns: ["fuel_type_id"]
            isOneToOne: false
            referencedRelation: "fuel_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_transmission_type_id_fkey"
            columns: ["transmission_type_id"]
            isOneToOne: false
            referencedRelation: "transmission_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_vehicle_type_id_fkey"
            columns: ["vehicle_type_id"]
            isOneToOne: false
            referencedRelation: "vehicle_types"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          settings: Json
          slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          settings?: Json
          slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          settings?: Json
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      transmission_types: {
        Row: {
          display_order: number | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          display_order?: number | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          is_active: boolean
          last_name: string | null
          organization_id: string | null
          phone: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          organization_id?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          organization_id?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_types: {
        Row: {
          display_order: number | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          display_order?: number | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const