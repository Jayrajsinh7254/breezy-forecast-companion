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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      airfields: {
        Row: {
          code: string
          country: string
          created_at: string | null
          elevation: number
          id: string
          is_active: boolean
          latitude: number
          longitude: number
          name: string
          timezone: string
          updated_at: string | null
        }
        Insert: {
          code: string
          country: string
          created_at?: string | null
          elevation?: number
          id?: string
          is_active?: boolean
          latitude: number
          longitude: number
          name: string
          timezone?: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          country?: string
          created_at?: string | null
          elevation?: number
          id?: string
          is_active?: boolean
          latitude?: number
          longitude?: number
          name?: string
          timezone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      gap_analysis_features: {
        Row: {
          category: string
          description: string
          feature_name: string
          id: string
          implementation_notes: string | null
          is_missing: boolean
          is_present: boolean
          priority: string
          updated_at: string | null
        }
        Insert: {
          category: string
          description: string
          feature_name: string
          id?: string
          implementation_notes?: string | null
          is_missing?: boolean
          is_present?: boolean
          priority?: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          description?: string
          feature_name?: string
          id?: string
          implementation_notes?: string | null
          is_missing?: boolean
          is_present?: boolean
          priority?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      user_weather_preferences: {
        Row: {
          created_at: string
          default_location: string | null
          favorite_locations: Json | null
          id: string
          notifications_enabled: boolean | null
          temperature_unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_location?: string | null
          favorite_locations?: Json | null
          id?: string
          notifications_enabled?: boolean | null
          temperature_unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_location?: string | null
          favorite_locations?: Json | null
          id?: string
          notifications_enabled?: boolean | null
          temperature_unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weather_alerts: {
        Row: {
          acknowledged_at: string | null
          actual_value: number | null
          airfield_id: string
          alert_type: string
          confidence_score: number | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          message: string
          severity: string
          threshold_value: number | null
          title: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          actual_value?: number | null
          airfield_id: string
          alert_type: string
          confidence_score?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          message: string
          severity: string
          threshold_value?: number | null
          title: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          actual_value?: number | null
          airfield_id?: string
          alert_type?: string
          confidence_score?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          message?: string
          severity?: string
          threshold_value?: number | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weather_alerts_airfield_id_fkey"
            columns: ["airfield_id"]
            isOneToOne: false
            referencedRelation: "airfields"
            referencedColumns: ["id"]
          },
        ]
      }
      weather_forecasts: {
        Row: {
          airfield_id: string
          ceiling: number | null
          confidence_score: number | null
          created_at: string | null
          forecast_hour: number
          forecast_time: string
          forecast_type: string
          id: string
          model_version: string
          precipitation_probability: number | null
          temperature: number | null
          visibility: number | null
          wind_direction: number | null
          wind_speed: number | null
        }
        Insert: {
          airfield_id: string
          ceiling?: number | null
          confidence_score?: number | null
          created_at?: string | null
          forecast_hour: number
          forecast_time: string
          forecast_type: string
          id?: string
          model_version?: string
          precipitation_probability?: number | null
          temperature?: number | null
          visibility?: number | null
          wind_direction?: number | null
          wind_speed?: number | null
        }
        Update: {
          airfield_id?: string
          ceiling?: number | null
          confidence_score?: number | null
          created_at?: string | null
          forecast_hour?: number
          forecast_time?: string
          forecast_type?: string
          id?: string
          model_version?: string
          precipitation_probability?: number | null
          temperature?: number | null
          visibility?: number | null
          wind_direction?: number | null
          wind_speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "weather_forecasts_airfield_id_fkey"
            columns: ["airfield_id"]
            isOneToOne: false
            referencedRelation: "airfields"
            referencedColumns: ["id"]
          },
        ]
      }
      weather_thresholds: {
        Row: {
          airfield_id: string
          ceiling_min: number | null
          created_at: string | null
          crosswind_max: number | null
          id: string
          is_active: boolean
          temperature_max: number | null
          temperature_min: number | null
          updated_at: string | null
          user_id: string
          visibility_min: number | null
          wind_speed_max: number | null
        }
        Insert: {
          airfield_id: string
          ceiling_min?: number | null
          created_at?: string | null
          crosswind_max?: number | null
          id?: string
          is_active?: boolean
          temperature_max?: number | null
          temperature_min?: number | null
          updated_at?: string | null
          user_id: string
          visibility_min?: number | null
          wind_speed_max?: number | null
        }
        Update: {
          airfield_id?: string
          ceiling_min?: number | null
          created_at?: string | null
          crosswind_max?: number | null
          id?: string
          is_active?: boolean
          temperature_max?: number | null
          temperature_min?: number | null
          updated_at?: string | null
          user_id?: string
          visibility_min?: number | null
          wind_speed_max?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "weather_thresholds_airfield_id_fkey"
            columns: ["airfield_id"]
            isOneToOne: false
            referencedRelation: "airfields"
            referencedColumns: ["id"]
          },
        ]
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
