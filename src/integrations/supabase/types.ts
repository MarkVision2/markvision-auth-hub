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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ai_bridge_tasks: {
        Row: {
          created_at: string | null
          execution_logs: Json | null
          id: string
          project_id: string | null
          prompt: string
          response: string | null
          source: string | null
          status: string | null
          telegram_chat_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          execution_logs?: Json | null
          id?: string
          project_id?: string | null
          prompt: string
          response?: string | null
          source?: string | null
          status?: string | null
          telegram_chat_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          execution_logs?: Json | null
          id?: string
          project_id?: string | null
          prompt?: string
          response?: string | null
          source?: string | null
          status?: string | null
          telegram_chat_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_rop_audits: {
        Row: {
          ai_score: number | null
          ai_summary: string | null
          audio_url: string | null
          checklist: Json | null
          created_at: string | null
          duration_seconds: number | null
          id: string
          interaction_type: string
          lead_id: string | null
          manager_name: string
          project_id: string | null
          transcript: Json | null
        }
        Insert: {
          ai_score?: number | null
          ai_summary?: string | null
          audio_url?: string | null
          checklist?: Json | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          interaction_type: string
          lead_id?: string | null
          manager_name: string
          project_id?: string | null
          transcript?: Json | null
        }
        Update: {
          ai_score?: number | null
          ai_summary?: string | null
          audio_url?: string | null
          checklist?: Json | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          interaction_type?: string
          lead_id?: string | null
          manager_name?: string
          project_id?: string | null
          transcript?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_rop_audits_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_rop_audits_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      clients_config: {
        Row: {
          ad_account_id: string | null
          brief: string | null
          city: string | null
          client_name: string
          created_at: string | null
          daily_budget: number | null
          fb_pixel_id: string | null
          fb_token: string | null
          id: string
          instagram_user_id: string | null
          is_active: boolean | null
          meta_leads: number | null
          page_id: string | null
          page_name: string | null
          pixel_event: string | null
          project_id: string | null
          region_key: string | null
          spend: number | null
          telegram_group_id: string | null
          website_url: string | null
          whatsapp_number: string | null
        }
        Insert: {
          ad_account_id?: string | null
          brief?: string | null
          city?: string | null
          client_name: string
          created_at?: string | null
          daily_budget?: number | null
          fb_pixel_id?: string | null
          fb_token?: string | null
          id?: string
          instagram_user_id?: string | null
          is_active?: boolean | null
          meta_leads?: number | null
          page_id?: string | null
          page_name?: string | null
          pixel_event?: string | null
          project_id?: string | null
          region_key?: string | null
          spend?: number | null
          telegram_group_id?: string | null
          website_url?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          ad_account_id?: string | null
          brief?: string | null
          city?: string | null
          client_name?: string
          created_at?: string | null
          daily_budget?: number | null
          fb_pixel_id?: string | null
          fb_token?: string | null
          id?: string
          instagram_user_id?: string | null
          is_active?: boolean | null
          meta_leads?: number | null
          page_id?: string | null
          page_name?: string | null
          pixel_event?: string | null
          project_id?: string | null
          region_key?: string | null
          spend?: number | null
          telegram_group_id?: string | null
          website_url?: string | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_config_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_ads: {
        Row: {
          active_since: string | null
          ad_copy: string | null
          advertiser_avatar: string | null
          advertiser_name: string
          created_at: string | null
          id: string
          is_active: boolean | null
          is_monitored: boolean | null
          media_type: string | null
          media_url: string | null
          page_id: string | null
          platform: string | null
          project_id: string | null
          scrape_status: string | null
          source_url: string | null
          updated_at: string | null
        }
        Insert: {
          active_since?: string | null
          ad_copy?: string | null
          advertiser_avatar?: string | null
          advertiser_name: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_monitored?: boolean | null
          media_type?: string | null
          media_url?: string | null
          page_id?: string | null
          platform?: string | null
          project_id?: string | null
          scrape_status?: string | null
          source_url?: string | null
          updated_at?: string | null
        }
        Update: {
          active_since?: string | null
          ad_copy?: string | null
          advertiser_avatar?: string | null
          advertiser_name?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_monitored?: boolean | null
          media_type?: string | null
          media_url?: string | null
          page_id?: string | null
          platform?: string | null
          project_id?: string | null
          scrape_status?: string | null
          source_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_ads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      content_tasks: {
        Row: {
          aspect_ratio: string | null
          content_type: string
          created_at: string | null
          custom_font_url: string | null
          custom_logo_url: string | null
          design_template: string | null
          format: string | null
          id: string
          main_text: string | null
          progress_text: string | null
          project_id: string | null
          result_urls: Json | null
          source_type: string | null
          source_url: string | null
          status: string | null
          updated_at: string | null
          visual_style: string | null
        }
        Insert: {
          aspect_ratio?: string | null
          content_type: string
          created_at?: string | null
          custom_font_url?: string | null
          custom_logo_url?: string | null
          design_template?: string | null
          format?: string | null
          id?: string
          main_text?: string | null
          progress_text?: string | null
          project_id?: string | null
          result_urls?: Json | null
          source_type?: string | null
          source_url?: string | null
          status?: string | null
          updated_at?: string | null
          visual_style?: string | null
        }
        Update: {
          aspect_ratio?: string | null
          content_type?: string
          created_at?: string | null
          custom_font_url?: string | null
          custom_logo_url?: string | null
          design_template?: string | null
          format?: string | null
          id?: string
          main_text?: string | null
          progress_text?: string | null
          project_id?: string | null
          result_urls?: Json | null
          source_type?: string | null
          source_url?: string | null
          status?: string | null
          updated_at?: string | null
          visual_style?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_automations: {
        Row: {
          action_detail: string | null
          action_type: string
          created_at: string
          icon: string | null
          id: string
          is_enabled: boolean
          project_id: string | null
          trigger_type: string
          trigger_value: string
        }
        Insert: {
          action_detail?: string | null
          action_type: string
          created_at?: string
          icon?: string | null
          id?: string
          is_enabled?: boolean
          project_id?: string | null
          trigger_type: string
          trigger_value: string
        }
        Update: {
          action_detail?: string | null
          action_type?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_enabled?: boolean
          project_id?: string | null
          trigger_type?: string
          trigger_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_automations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_messages: {
        Row: {
          body: string
          channel: string | null
          created_at: string
          direction: string
          id: string
          lead_id: string
          read: boolean
          sender_type: string
        }
        Insert: {
          body: string
          channel?: string | null
          created_at?: string
          direction?: string
          id?: string
          lead_id: string
          read?: boolean
          sender_type?: string
        }
        Update: {
          body?: string
          channel?: string | null
          created_at?: string
          direction?: string
          id?: string
          lead_id?: string
          read?: boolean
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_notes: {
        Row: {
          author_name: string
          body: string
          created_at: string
          id: string
          lead_id: string
        }
        Insert: {
          author_name?: string
          body: string
          created_at?: string
          id?: string
          lead_id: string
        }
        Update: {
          author_name?: string
          body?: string
          created_at?: string
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          ai_score: number | null
          ai_summary: string | null
          amount: number | null
          client_config_id: string | null
          created_at: string | null
          id: string
          name: string
          phone: string | null
          project_id: string | null
          source: string | null
          status: string | null
          updated_at: string | null
          utm_campaign: string | null
        }
        Insert: {
          ai_score?: number | null
          ai_summary?: string | null
          amount?: number | null
          client_config_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          phone?: string | null
          project_id?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
        }
        Update: {
          ai_score?: number | null
          ai_summary?: string | null
          amount?: number | null
          client_config_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          phone?: string | null
          project_id?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_client_config_id_fkey"
            columns: ["client_config_id"]
            isOneToOne: false
            referencedRelation: "agency_metrics_view"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "leads_client_config_id_fkey"
            columns: ["client_config_id"]
            isOneToOne: false
            referencedRelation: "clients_config"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      agency_metrics_view: {
        Row: {
          cac: number | null
          client_id: string | null
          client_name: string | null
          cpl: number | null
          cpv: number | null
          is_active: boolean | null
          meta_leads: number | null
          revenue: number | null
          romi: number | null
          sales: number | null
          spend: number | null
          visits: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
