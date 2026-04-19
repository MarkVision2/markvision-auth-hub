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
      ad_account_project: {
        Row: {
          ad_account_id: string
          created_at: string | null
          project_id: string | null
        }
        Insert: {
          ad_account_id: string
          created_at?: string | null
          project_id?: string | null
        }
        Update: {
          ad_account_id?: string
          created_at?: string | null
          project_id?: string | null
        }
        Relationships: []
      }
      ad_conversations: {
        Row: {
          ad_account_id: string | null
          analysis_date: string | null
          appointment_confirmed: boolean | null
          city_confirmed: boolean | null
          conversation_id: string | null
          created_at: string | null
          gemini_analysis: Json | null
          id: string
          project_id: string | null
          quality_score: number | null
          raw_messages: Json | null
          service_confirmed: boolean | null
          spam: boolean | null
          summary: string | null
        }
        Insert: {
          ad_account_id?: string | null
          analysis_date?: string | null
          appointment_confirmed?: boolean | null
          city_confirmed?: boolean | null
          conversation_id?: string | null
          created_at?: string | null
          gemini_analysis?: Json | null
          id?: string
          project_id?: string | null
          quality_score?: number | null
          raw_messages?: Json | null
          service_confirmed?: boolean | null
          spam?: boolean | null
          summary?: string | null
        }
        Update: {
          ad_account_id?: string | null
          analysis_date?: string | null
          appointment_confirmed?: boolean | null
          city_confirmed?: boolean | null
          conversation_id?: string | null
          created_at?: string | null
          gemini_analysis?: Json | null
          id?: string
          project_id?: string | null
          quality_score?: number | null
          raw_messages?: Json | null
          service_confirmed?: boolean | null
          spam?: boolean | null
          summary?: string | null
        }
        Relationships: []
      }
      agency_billing: {
        Row: {
          created_at: string | null
          id: string
          infrastructure_cost: number | null
          next_payment_date: string | null
          payment_status: string | null
          project_id: string | null
          subscription_fee: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          infrastructure_cost?: number | null
          next_payment_date?: string | null
          payment_status?: string | null
          project_id?: string | null
          subscription_fee?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          infrastructure_cost?: number | null
          next_payment_date?: string | null
          payment_status?: string | null
          project_id?: string | null
          subscription_fee?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agency_billing_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
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
      ai_edit_assets: {
        Row: {
          cost_cents: number | null
          created_at: string
          duration_ms: number | null
          external_task_id: string | null
          id: string
          kind: string
          metadata: Json | null
          model: string | null
          project_id: string
          prompt: string | null
          provider: string | null
          source: string
          status: string
          updated_at: string
          url: string | null
        }
        Insert: {
          cost_cents?: number | null
          created_at?: string
          duration_ms?: number | null
          external_task_id?: string | null
          id?: string
          kind: string
          metadata?: Json | null
          model?: string | null
          project_id: string
          prompt?: string | null
          provider?: string | null
          source: string
          status?: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          cost_cents?: number | null
          created_at?: string
          duration_ms?: number | null
          external_task_id?: string | null
          id?: string
          kind?: string
          metadata?: Json | null
          model?: string | null
          project_id?: string
          prompt?: string | null
          provider?: string | null
          source?: string
          status?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_edit_assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ai_edit_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_edit_cost_ledger: {
        Row: {
          cost_cents: number
          created_at: string
          id: string
          meta: Json | null
          project_id: string
          provider: string | null
          step: string
          unit_type: string | null
          units: number | null
        }
        Insert: {
          cost_cents?: number
          created_at?: string
          id?: string
          meta?: Json | null
          project_id: string
          provider?: string | null
          step: string
          unit_type?: string | null
          units?: number | null
        }
        Update: {
          cost_cents?: number
          created_at?: string
          id?: string
          meta?: Json | null
          project_id?: string
          provider?: string | null
          step?: string
          unit_type?: string | null
          units?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_edit_cost_ledger_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ai_edit_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_edit_projects: {
        Row: {
          auto_broll: boolean | null
          auto_zoom: boolean | null
          business_template: string | null
          caption_language: string
          clip_duration_mode: string | null
          clip_duration_sec: number | null
          created_at: string
          custom_broll_url: string | null
          custom_sfx_url: string | null
          error_message: string | null
          font_url: string | null
          format: string
          id: string
          intensity: string | null
          n8n_execution_id: string | null
          owner_id: string | null
          progress: number
          progress_text: string | null
          project_id: string | null
          script_hint: string | null
          source_duration_sec: number | null
          source_size_bytes: number | null
          source_video_url: string
          stage: string
          status: string
          style: string
          task_token: string
          updated_at: string
        }
        Insert: {
          auto_broll?: boolean | null
          auto_zoom?: boolean | null
          business_template?: string | null
          caption_language?: string
          clip_duration_mode?: string | null
          clip_duration_sec?: number | null
          created_at?: string
          custom_broll_url?: string | null
          custom_sfx_url?: string | null
          error_message?: string | null
          font_url?: string | null
          format?: string
          id?: string
          intensity?: string | null
          n8n_execution_id?: string | null
          owner_id?: string | null
          progress?: number
          progress_text?: string | null
          project_id?: string | null
          script_hint?: string | null
          source_duration_sec?: number | null
          source_size_bytes?: number | null
          source_video_url: string
          stage?: string
          status?: string
          style?: string
          task_token?: string
          updated_at?: string
        }
        Update: {
          auto_broll?: boolean | null
          auto_zoom?: boolean | null
          business_template?: string | null
          caption_language?: string
          clip_duration_mode?: string | null
          clip_duration_sec?: number | null
          created_at?: string
          custom_broll_url?: string | null
          custom_sfx_url?: string | null
          error_message?: string | null
          font_url?: string | null
          format?: string
          id?: string
          intensity?: string | null
          n8n_execution_id?: string | null
          owner_id?: string | null
          progress?: number
          progress_text?: string | null
          project_id?: string | null
          script_hint?: string | null
          source_duration_sec?: number | null
          source_size_bytes?: number | null
          source_video_url?: string
          stage?: string
          status?: string
          style?: string
          task_token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_edit_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_edit_renders: {
        Row: {
          cost_cents: number | null
          created_at: string
          duration_sec: number | null
          id: string
          output_url: string | null
          project_id: string
          render_ms: number | null
          size_bytes: number | null
          status: string
          thumbnail_url: string | null
          variant_name: string | null
          variant_notes: string | null
          version: number
        }
        Insert: {
          cost_cents?: number | null
          created_at?: string
          duration_sec?: number | null
          id?: string
          output_url?: string | null
          project_id: string
          render_ms?: number | null
          size_bytes?: number | null
          status?: string
          thumbnail_url?: string | null
          variant_name?: string | null
          variant_notes?: string | null
          version?: number
        }
        Update: {
          cost_cents?: number | null
          created_at?: string
          duration_sec?: number | null
          id?: string
          output_url?: string | null
          project_id?: string
          render_ms?: number | null
          size_bytes?: number | null
          status?: string
          thumbnail_url?: string | null
          variant_name?: string | null
          variant_notes?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_edit_renders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ai_edit_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_edit_segments: {
        Row: {
          created_at: string
          data: Json
          end_ms: number
          id: string
          is_ai_generated: boolean
          is_deleted: boolean
          is_user_edited: boolean
          order_index: number
          project_id: string
          start_ms: number
          type: string
        }
        Insert: {
          created_at?: string
          data?: Json
          end_ms: number
          id?: string
          is_ai_generated?: boolean
          is_deleted?: boolean
          is_user_edited?: boolean
          order_index?: number
          project_id: string
          start_ms: number
          type: string
        }
        Update: {
          created_at?: string
          data?: Json
          end_ms?: number
          id?: string
          is_ai_generated?: boolean
          is_deleted?: boolean
          is_user_edited?: boolean
          order_index?: number
          project_id?: string
          start_ms?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_edit_segments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ai_edit_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_edit_style_presets: {
        Row: {
          config: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_premium: boolean | null
          label: string
          name: string
          preview_url: string | null
          sort_order: number | null
        }
        Insert: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          label: string
          name: string
          preview_url?: string | null
          sort_order?: number | null
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          label?: string
          name?: string
          preview_url?: string | null
          sort_order?: number | null
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
            foreignKeyName: "ai_rop_audits_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_campaigns: {
        Row: {
          channel_id: string
          clicks: number
          created_at: string | null
          id: string
          leads: number
          name: string
          revenue: number
          sales: number
          spend: number
          visits: number
        }
        Insert: {
          channel_id: string
          clicks?: number
          created_at?: string | null
          id?: string
          leads?: number
          name: string
          revenue?: number
          sales?: number
          spend?: number
          visits?: number
        }
        Update: {
          channel_id?: string
          clicks?: number
          created_at?: string | null
          id?: string
          leads?: number
          name?: string
          revenue?: number
          sales?: number
          spend?: number
          visits?: number
        }
        Relationships: [
          {
            foreignKeyName: "analytics_campaigns_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "analytics_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_channels: {
        Row: {
          clicks: number
          color: string
          created_at: string | null
          icon: string
          id: string
          leads: number
          name: string
          period_end: string | null
          period_start: string | null
          project_id: string | null
          revenue: number
          sales: number
          spend: number
          visits: number
        }
        Insert: {
          clicks?: number
          color?: string
          created_at?: string | null
          icon?: string
          id?: string
          leads?: number
          name: string
          period_end?: string | null
          period_start?: string | null
          project_id?: string | null
          revenue?: number
          sales?: number
          spend?: number
          visits?: number
        }
        Update: {
          clicks?: number
          color?: string
          created_at?: string | null
          icon?: string
          id?: string
          leads?: number
          name?: string
          period_end?: string | null
          period_start?: string | null
          project_id?: string | null
          revenue?: number
          sales?: number
          spend?: number
          visits?: number
        }
        Relationships: [
          {
            foreignKeyName: "analytics_channels_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_creatives: {
        Row: {
          campaign_id: string
          clicks: number
          created_at: string | null
          format: string
          id: string
          landing: string | null
          leads: number
          name: string
          revenue: number
          sales: number
          spend: number
          thumbnail: string | null
          visits: number
        }
        Insert: {
          campaign_id: string
          clicks?: number
          created_at?: string | null
          format?: string
          id?: string
          landing?: string | null
          leads?: number
          name: string
          revenue?: number
          sales?: number
          spend?: number
          thumbnail?: string | null
          visits?: number
        }
        Update: {
          campaign_id?: string
          clicks?: number
          created_at?: string | null
          format?: string
          id?: string
          landing?: string | null
          leads?: number
          name?: string
          revenue?: number
          sales?: number
          spend?: number
          thumbnail?: string | null
          visits?: number
        }
        Relationships: [
          {
            foreignKeyName: "analytics_creatives_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "analytics_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_organic_posts: {
        Row: {
          caption: string
          created_at: string | null
          dms: number
          id: string
          leads: number
          ltv: number
          project_id: string | null
          revenue: number
          sales: number
          thumbnail: string | null
          trigger_word: string | null
        }
        Insert: {
          caption: string
          created_at?: string | null
          dms?: number
          id?: string
          leads?: number
          ltv?: number
          project_id?: string | null
          revenue?: number
          sales?: number
          thumbnail?: string | null
          trigger_word?: string | null
        }
        Update: {
          caption?: string
          created_at?: string | null
          dms?: number
          id?: string
          leads?: number
          ltv?: number
          project_id?: string | null
          revenue?: number
          sales?: number
          thumbnail?: string | null
          trigger_word?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_organic_posts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          anamnesis: Json | null
          appointment_date: string
          created_at: string | null
          diagnosis: string | null
          doctor_id: string | null
          id: string
          lead_id: string | null
          objection: string | null
          package_price: number | null
          project_id: string | null
          proposed_package: string | null
          sale_status: string | null
          status: string | null
        }
        Insert: {
          anamnesis?: Json | null
          appointment_date: string
          created_at?: string | null
          diagnosis?: string | null
          doctor_id?: string | null
          id?: string
          lead_id?: string | null
          objection?: string | null
          package_price?: number | null
          project_id?: string | null
          proposed_package?: string | null
          sale_status?: string | null
          status?: string | null
        }
        Update: {
          anamnesis?: Json | null
          appointment_date?: string
          created_at?: string | null
          diagnosis?: string | null
          doctor_id?: string | null
          id?: string
          lead_id?: string | null
          objection?: string | null
          package_price?: number | null
          project_id?: string | null
          proposed_package?: string | null
          sale_status?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      autopost_items: {
        Row: {
          caption: string | null
          channels: Json
          clicks: number
          content_task_id: string | null
          created_at: string | null
          id: string
          impressions: number
          leads: number
          media_type: string
          media_url: string
          project_id: string | null
          published_at: string | null
          revenue: number
          sales: number
          scheduled_at: string | null
          status: string
          updated_at: string | null
          visits: number
        }
        Insert: {
          caption?: string | null
          channels?: Json
          clicks?: number
          content_task_id?: string | null
          created_at?: string | null
          id?: string
          impressions?: number
          leads?: number
          media_type?: string
          media_url: string
          project_id?: string | null
          published_at?: string | null
          revenue?: number
          sales?: number
          scheduled_at?: string | null
          status?: string
          updated_at?: string | null
          visits?: number
        }
        Update: {
          caption?: string | null
          channels?: Json
          clicks?: number
          content_task_id?: string | null
          created_at?: string | null
          id?: string
          impressions?: number
          leads?: number
          media_type?: string
          media_url?: string
          project_id?: string | null
          published_at?: string | null
          revenue?: number
          sales?: number
          scheduled_at?: string | null
          status?: string
          updated_at?: string | null
          visits?: number
        }
        Relationships: [
          {
            foreignKeyName: "autopost_items_content_task_id_fkey"
            columns: ["content_task_id"]
            isOneToOne: false
            referencedRelation: "content_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autopost_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      business_pages: {
        Row: {
          client_config_id: string
          created_at: string | null
          id: string
          instagram_user_id: string | null
          page_id: string
          page_name: string
        }
        Insert: {
          client_config_id: string
          created_at?: string | null
          id?: string
          instagram_user_id?: string | null
          page_id: string
          page_name: string
        }
        Update: {
          client_config_id?: string
          created_at?: string | null
          id?: string
          instagram_user_id?: string | null
          page_id?: string
          page_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_pages_client_config_id_fkey"
            columns: ["client_config_id"]
            isOneToOne: false
            referencedRelation: "agency_metrics_view"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "business_pages_client_config_id_fkey"
            columns: ["client_config_id"]
            isOneToOne: false
            referencedRelation: "clients_config"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_learnings: {
        Row: {
          ad_name: string | null
          ad_text: string | null
          adset_name: string | null
          avg_cpl: number | null
          campaign_name: string | null
          client_config_id: string | null
          cpl_trend: string | null
          cpm: number | null
          created_at: string | null
          ctr: number | null
          days_active: number | null
          depth_2_rate: number | null
          depth_3_rate: number | null
          fb_ad_id: string | null
          fb_adset_id: string | null
          fb_campaign_id: string | null
          headline: string | null
          ice_breakers: Json | null
          id: string
          impressions: number | null
          is_paused: boolean | null
          is_winner: boolean | null
          lesson_learned: string | null
          media_type: string | null
          pause_reason: string | null
          project_id: string | null
          quality_score: number | null
          reply_rate: number | null
          score_label: string | null
          score_trend: string | null
          targeting_json: Json | null
          total_leads: number | null
          total_spend: number | null
          updated_at: string | null
          welcome_message: string | null
        }
        Insert: {
          ad_name?: string | null
          ad_text?: string | null
          adset_name?: string | null
          avg_cpl?: number | null
          campaign_name?: string | null
          client_config_id?: string | null
          cpl_trend?: string | null
          cpm?: number | null
          created_at?: string | null
          ctr?: number | null
          days_active?: number | null
          depth_2_rate?: number | null
          depth_3_rate?: number | null
          fb_ad_id?: string | null
          fb_adset_id?: string | null
          fb_campaign_id?: string | null
          headline?: string | null
          ice_breakers?: Json | null
          id?: string
          impressions?: number | null
          is_paused?: boolean | null
          is_winner?: boolean | null
          lesson_learned?: string | null
          media_type?: string | null
          pause_reason?: string | null
          project_id?: string | null
          quality_score?: number | null
          reply_rate?: number | null
          score_label?: string | null
          score_trend?: string | null
          targeting_json?: Json | null
          total_leads?: number | null
          total_spend?: number | null
          updated_at?: string | null
          welcome_message?: string | null
        }
        Update: {
          ad_name?: string | null
          ad_text?: string | null
          adset_name?: string | null
          avg_cpl?: number | null
          campaign_name?: string | null
          client_config_id?: string | null
          cpl_trend?: string | null
          cpm?: number | null
          created_at?: string | null
          ctr?: number | null
          days_active?: number | null
          depth_2_rate?: number | null
          depth_3_rate?: number | null
          fb_ad_id?: string | null
          fb_adset_id?: string | null
          fb_campaign_id?: string | null
          headline?: string | null
          ice_breakers?: Json | null
          id?: string
          impressions?: number | null
          is_paused?: boolean | null
          is_winner?: boolean | null
          lesson_learned?: string | null
          media_type?: string | null
          pause_reason?: string | null
          project_id?: string | null
          quality_score?: number | null
          reply_rate?: number | null
          score_label?: string | null
          score_trend?: string | null
          targeting_json?: Json | null
          total_leads?: number | null
          total_spend?: number | null
          updated_at?: string | null
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_learnings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          created_at: string | null
          id: string
          is_inbound: boolean | null
          lead_id: string | null
          message_text: string
          sender_name: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_inbound?: boolean | null
          lead_id?: string | null
          message_text: string
          sender_name?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_inbound?: boolean | null
          lead_id?: string | null
          message_text?: string
          sender_name?: string | null
        }
        Relationships: []
      }
      client_config_visibility: {
        Row: {
          client_config_id: string
          created_at: string | null
          id: string
          project_id: string
        }
        Insert: {
          client_config_id: string
          created_at?: string | null
          id?: string
          project_id: string
        }
        Update: {
          client_config_id?: string
          created_at?: string | null
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_config_visibility_client_config_id_fkey"
            columns: ["client_config_id"]
            isOneToOne: false
            referencedRelation: "agency_metrics_view"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_config_visibility_client_config_id_fkey"
            columns: ["client_config_id"]
            isOneToOne: false
            referencedRelation: "clients_config"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_config_visibility_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      clients_config: {
        Row: {
          account_type: string
          ad_account_id: string | null
          brief: string | null
          city: string | null
          clicks: number | null
          client_name: string
          created_at: string | null
          daily_budget: number | null
          fb_pixel_id: string | null
          fb_token: string | null
          followers: number | null
          id: string
          impressions: number | null
          instagram_user_id: string | null
          is_active: boolean | null
          is_agency: boolean | null
          max_budget_cap: number | null
          max_cpl: number | null
          max_spend_no_lead: number | null
          meta_leads: number | null
          page_id: string | null
          page_name: string | null
          pixel_event: string | null
          project_id: string | null
          region_key: string | null
          revenue: number | null
          romi: number | null
          sales: number | null
          scale_factor: number | null
          spend: number | null
          telegram_group_id: string | null
          visits: number | null
          website_url: string | null
          whatsapp_number: string | null
        }
        Insert: {
          account_type?: string
          ad_account_id?: string | null
          brief?: string | null
          city?: string | null
          clicks?: number | null
          client_name: string
          created_at?: string | null
          daily_budget?: number | null
          fb_pixel_id?: string | null
          fb_token?: string | null
          followers?: number | null
          id?: string
          impressions?: number | null
          instagram_user_id?: string | null
          is_active?: boolean | null
          is_agency?: boolean | null
          max_budget_cap?: number | null
          max_cpl?: number | null
          max_spend_no_lead?: number | null
          meta_leads?: number | null
          page_id?: string | null
          page_name?: string | null
          pixel_event?: string | null
          project_id?: string | null
          region_key?: string | null
          revenue?: number | null
          romi?: number | null
          sales?: number | null
          scale_factor?: number | null
          spend?: number | null
          telegram_group_id?: string | null
          visits?: number | null
          website_url?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          account_type?: string
          ad_account_id?: string | null
          brief?: string | null
          city?: string | null
          clicks?: number | null
          client_name?: string
          created_at?: string | null
          daily_budget?: number | null
          fb_pixel_id?: string | null
          fb_token?: string | null
          followers?: number | null
          id?: string
          impressions?: number | null
          instagram_user_id?: string | null
          is_active?: boolean | null
          is_agency?: boolean | null
          max_budget_cap?: number | null
          max_cpl?: number | null
          max_spend_no_lead?: number | null
          meta_leads?: number | null
          page_id?: string | null
          page_name?: string | null
          pixel_event?: string | null
          project_id?: string | null
          region_key?: string | null
          revenue?: number | null
          romi?: number | null
          sales?: number | null
          scale_factor?: number | null
          spend?: number | null
          telegram_group_id?: string | null
          visits?: number | null
          website_url?: string | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_config_project_id_fkey1"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      clients_config_old: {
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
          is_agency: boolean | null
          meta_leads: number | null
          page_id: string | null
          page_name: string | null
          pixel_event: string | null
          project_id: string | null
          region_key: string | null
          revenue: number | null
          romi: number | null
          sales: number | null
          spend: number | null
          telegram_group_id: string | null
          visits: number | null
          wa_api_token: string | null
          wa_instance_id: string | null
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
          is_agency?: boolean | null
          meta_leads?: number | null
          page_id?: string | null
          page_name?: string | null
          pixel_event?: string | null
          project_id?: string | null
          region_key?: string | null
          revenue?: number | null
          romi?: number | null
          sales?: number | null
          spend?: number | null
          telegram_group_id?: string | null
          visits?: number | null
          wa_api_token?: string | null
          wa_instance_id?: string | null
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
          is_agency?: boolean | null
          meta_leads?: number | null
          page_id?: string | null
          page_name?: string | null
          pixel_event?: string | null
          project_id?: string | null
          region_key?: string | null
          revenue?: number | null
          romi?: number | null
          sales?: number | null
          spend?: number | null
          telegram_group_id?: string | null
          visits?: number | null
          wa_api_token?: string | null
          wa_instance_id?: string | null
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
      clients_secrets: {
        Row: {
          client_config_id: string
          created_at: string | null
          fb_token: string | null
          id: string
          updated_at: string | null
          wa_api_token: string | null
          wa_instance_id: string | null
          waba_phone_number_id: string | null
        }
        Insert: {
          client_config_id: string
          created_at?: string | null
          fb_token?: string | null
          id?: string
          updated_at?: string | null
          wa_api_token?: string | null
          wa_instance_id?: string | null
          waba_phone_number_id?: string | null
        }
        Update: {
          client_config_id?: string
          created_at?: string | null
          fb_token?: string | null
          id?: string
          updated_at?: string | null
          wa_api_token?: string | null
          wa_instance_id?: string | null
          waba_phone_number_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_secrets_client_config_id_fkey"
            columns: ["client_config_id"]
            isOneToOne: true
            referencedRelation: "agency_metrics_view"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "clients_secrets_client_config_id_fkey"
            columns: ["client_config_id"]
            isOneToOne: true
            referencedRelation: "clients_config"
            referencedColumns: ["id"]
          },
        ]
      }
      clony_requests: {
        Row: {
          content_type: string | null
          created_at: string | null
          description: string | null
          execution_id: string | null
          id: string
          log_url: string | null
          name: string | null
          request_id: string | null
          slides_count: number | null
          slides_json: Json | null
          status: string | null
          telegram_id: string | null
          updated_at: string | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string | null
          description?: string | null
          execution_id?: string | null
          id?: string
          log_url?: string | null
          name?: string | null
          request_id?: string | null
          slides_count?: number | null
          slides_json?: Json | null
          status?: string | null
          telegram_id?: string | null
          updated_at?: string | null
        }
        Update: {
          content_type?: string | null
          created_at?: string | null
          description?: string | null
          execution_id?: string | null
          id?: string
          log_url?: string | null
          name?: string | null
          request_id?: string | null
          slides_count?: number | null
          slides_json?: Json | null
          status?: string | null
          telegram_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      competitor_ads: {
        Row: {
          active_since: string | null
          ad_archive_id: string | null
          ad_copy: string | null
          ad_status: string | null
          ad_text: string | null
          advertiser_avatar: string | null
          advertiser_name: string
          created_at: string | null
          id: string
          is_active: boolean | null
          is_monitored: boolean | null
          media_type: string | null
          media_url: string | null
          page_id: string | null
          page_name: string | null
          platform: string | null
          project_id: string | null
          scrape_status: string | null
          source_url: string | null
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          active_since?: string | null
          ad_archive_id?: string | null
          ad_copy?: string | null
          ad_status?: string | null
          ad_text?: string | null
          advertiser_avatar?: string | null
          advertiser_name: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_monitored?: boolean | null
          media_type?: string | null
          media_url?: string | null
          page_id?: string | null
          page_name?: string | null
          platform?: string | null
          project_id?: string | null
          scrape_status?: string | null
          source_url?: string | null
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          active_since?: string | null
          ad_archive_id?: string | null
          ad_copy?: string | null
          ad_status?: string | null
          ad_text?: string | null
          advertiser_avatar?: string | null
          advertiser_name?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_monitored?: boolean | null
          media_type?: string | null
          media_url?: string | null
          page_id?: string | null
          page_name?: string | null
          platform?: string | null
          project_id?: string | null
          scrape_status?: string | null
          source_url?: string | null
          start_date?: string | null
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
      competitors: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          engagement_rate: string | null
          followers: string | null
          id: string
          is_active: boolean | null
          platform: string
          project_id: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          engagement_rate?: string | null
          followers?: string | null
          id?: string
          is_active?: boolean | null
          platform?: string
          project_id?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          engagement_rate?: string | null
          followers?: string | null
          id?: string
          is_active?: boolean | null
          platform?: string
          project_id?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitors_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      content_factory: {
        Row: {
          ai_analysis: string | null
          competitor_id: string | null
          created_at: string | null
          generated_script: string | null
          hook: string | null
          id: string
          performance_score: number | null
          post_caption: string | null
          post_type: string | null
          project_id: string | null
          status: string | null
          strengths: string[] | null
          transcription: string | null
          updated_at: string | null
          video_url: string | null
          weaknesses: string[] | null
        }
        Insert: {
          ai_analysis?: string | null
          competitor_id?: string | null
          created_at?: string | null
          generated_script?: string | null
          hook?: string | null
          id?: string
          performance_score?: number | null
          post_caption?: string | null
          post_type?: string | null
          project_id?: string | null
          status?: string | null
          strengths?: string[] | null
          transcription?: string | null
          updated_at?: string | null
          video_url?: string | null
          weaknesses?: string[] | null
        }
        Update: {
          ai_analysis?: string | null
          competitor_id?: string | null
          created_at?: string | null
          generated_script?: string | null
          hook?: string | null
          id?: string
          performance_score?: number | null
          post_caption?: string | null
          post_type?: string | null
          project_id?: string | null
          status?: string | null
          strengths?: string[] | null
          transcription?: string | null
          updated_at?: string | null
          video_url?: string | null
          weaknesses?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "content_factory_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_factory_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      content_feedback: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          task_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          task_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          task_id?: string
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      daily_data: {
        Row: {
          ad_account_id: string | null
          clicks: number | null
          client_config_id: string | null
          created_at: string | null
          date: string
          followers: number | null
          followers_total: number | null
          id: string
          impressions: number | null
          leads: number | null
          plan_leads: number | null
          plan_revenue: number | null
          plan_sales: number | null
          plan_spend: number | null
          plan_visits: number | null
          project_id: string | null
          revenue: number | null
          sales: number | null
          service_category: string | null
          spend: number | null
          visits: number | null
        }
        Insert: {
          ad_account_id?: string | null
          clicks?: number | null
          client_config_id?: string | null
          created_at?: string | null
          date: string
          followers?: number | null
          followers_total?: number | null
          id?: string
          impressions?: number | null
          leads?: number | null
          plan_leads?: number | null
          plan_revenue?: number | null
          plan_sales?: number | null
          plan_spend?: number | null
          plan_visits?: number | null
          project_id?: string | null
          revenue?: number | null
          sales?: number | null
          service_category?: string | null
          spend?: number | null
          visits?: number | null
        }
        Update: {
          ad_account_id?: string | null
          clicks?: number | null
          client_config_id?: string | null
          created_at?: string | null
          date?: string
          followers?: number | null
          followers_total?: number | null
          id?: string
          impressions?: number | null
          leads?: number | null
          plan_leads?: number | null
          plan_revenue?: number | null
          plan_sales?: number | null
          plan_spend?: number | null
          plan_visits?: number | null
          project_id?: string | null
          revenue?: number | null
          sales?: number | null
          service_category?: string | null
          spend?: number | null
          visits?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_metrics_client_config_id_fkey"
            columns: ["client_config_id"]
            isOneToOne: false
            referencedRelation: "agency_metrics_view"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "daily_metrics_client_config_id_fkey"
            columns: ["client_config_id"]
            isOneToOne: false
            referencedRelation: "clients_config"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_metrics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_questions: {
        Row: {
          category: string | null
          correct_answer: string | null
          created_at: string | null
          id: string
          options: Json | null
          question_text: string
        }
        Insert: {
          category?: string | null
          correct_answer?: string | null
          created_at?: string | null
          id?: string
          options?: Json | null
          question_text: string
        }
        Update: {
          category?: string | null
          correct_answer?: string | null
          created_at?: string | null
          id?: string
          options?: Json | null
          question_text?: string
        }
        Relationships: []
      }
      finance_client_billing: {
        Row: {
          billing_status: string
          client_config_id: string
          created_at: string | null
          expenses: number
          id: string
          next_billing: string | null
          updated_at: string | null
        }
        Insert: {
          billing_status?: string
          client_config_id: string
          created_at?: string | null
          expenses?: number
          id?: string
          next_billing?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_status?: string
          client_config_id?: string
          created_at?: string | null
          expenses?: number
          id?: string
          next_billing?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_client_billing_client_config_id_fkey"
            columns: ["client_config_id"]
            isOneToOne: true
            referencedRelation: "agency_metrics_view"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "finance_client_billing_client_config_id_fkey"
            columns: ["client_config_id"]
            isOneToOne: true
            referencedRelation: "clients_config"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_client_services: {
        Row: {
          client_config_id: string
          created_at: string | null
          id: string
          price: number
          service_name: string
        }
        Insert: {
          client_config_id: string
          created_at?: string | null
          id?: string
          price?: number
          service_name: string
        }
        Update: {
          client_config_id?: string
          created_at?: string | null
          id?: string
          price?: number
          service_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_client_services_client_config_id_fkey"
            columns: ["client_config_id"]
            isOneToOne: false
            referencedRelation: "agency_metrics_view"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "finance_client_services_client_config_id_fkey"
            columns: ["client_config_id"]
            isOneToOne: false
            referencedRelation: "clients_config"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_months: {
        Row: {
          created_at: string | null
          expenses: number
          id: string
          month_index: number
          plan_expenses: number
          plan_revenue: number
          plan_salaries: number
          revenue: number
          salaries: number
          updated_at: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          expenses?: number
          id?: string
          month_index: number
          plan_expenses?: number
          plan_revenue?: number
          plan_salaries?: number
          revenue?: number
          salaries?: number
          updated_at?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          expenses?: number
          id?: string
          month_index?: number
          plan_expenses?: number
          plan_revenue?: number
          plan_salaries?: number
          revenue?: number
          salaries?: number
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      finance_team: {
        Row: {
          created_at: string | null
          id: string
          name: string
          project_id: string | null
          role: string
          salary: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          project_id?: string | null
          role?: string
          salary?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          project_id?: string | null
          role?: string
          salary?: number
        }
        Relationships: [
          {
            foreignKeyName: "finance_team_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      hq_targets: {
        Row: {
          active_projects: number
          followers: number
          id: string
          mrr: number
          spend: number
          updated_at: string | null
        }
        Insert: {
          active_projects?: number
          followers?: number
          id?: string
          mrr?: number
          spend?: number
          updated_at?: string | null
        }
        Update: {
          active_projects?: number
          followers?: number
          id?: string
          mrr?: number
          spend?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          ai_score: number | null
          ai_summary: string | null
          amount: number | null
          client_config_id: string | null
          created_at: string | null
          doctor_name: string | null
          external_lead_id: string | null
          extra_data: Json | null
          fb_ad_account_id: string | null
          fb_ad_id: string | null
          fb_adset_id: string | null
          fb_campaign_id: string | null
          id: string
          is_diagnostic: boolean | null
          lead_score: string | null
          name: string
          office_name: string | null
          phone: string | null
          pipeline: string | null
          prescribed_packages: string[] | null
          project_id: string | null
          refusal_reason: string | null
          scheduled_at: string | null
          score_label: string | null
          service_category: string | null
          serviced_by: string | null
          source: string | null
          status: string
          updated_at: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          ai_score?: number | null
          ai_summary?: string | null
          amount?: number | null
          client_config_id?: string | null
          created_at?: string | null
          doctor_name?: string | null
          external_lead_id?: string | null
          extra_data?: Json | null
          fb_ad_account_id?: string | null
          fb_ad_id?: string | null
          fb_adset_id?: string | null
          fb_campaign_id?: string | null
          id?: string
          is_diagnostic?: boolean | null
          lead_score?: string | null
          name?: string
          office_name?: string | null
          phone?: string | null
          pipeline?: string | null
          prescribed_packages?: string[] | null
          project_id?: string | null
          refusal_reason?: string | null
          scheduled_at?: string | null
          score_label?: string | null
          service_category?: string | null
          serviced_by?: string | null
          source?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          ai_score?: number | null
          ai_summary?: string | null
          amount?: number | null
          client_config_id?: string | null
          created_at?: string | null
          doctor_name?: string | null
          external_lead_id?: string | null
          extra_data?: Json | null
          fb_ad_account_id?: string | null
          fb_ad_id?: string | null
          fb_adset_id?: string | null
          fb_campaign_id?: string | null
          id?: string
          is_diagnostic?: boolean | null
          lead_score?: string | null
          name?: string
          office_name?: string | null
          phone?: string | null
          pipeline?: string | null
          prescribed_packages?: string[] | null
          project_id?: string | null
          refusal_reason?: string | null
          scheduled_at?: string | null
          score_label?: string | null
          service_category?: string | null
          serviced_by?: string | null
          source?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
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
          {
            foreignKeyName: "leads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      maps_leads: {
        Row: {
          city: string | null
          company_name: string | null
          company_type: string | null
          created_at: string | null
          email: string | null
          id: string
          phone: string | null
          socials: string | null
          summary: string | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          city?: string | null
          company_name?: string | null
          company_type?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          socials?: string | null
          summary?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          city?: string | null
          company_name?: string | null
          company_type?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          socials?: string | null
          summary?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      monthly_plans: {
        Row: {
          created_at: string | null
          id: string
          month_year: string
          plan_leads: number | null
          plan_revenue: number | null
          plan_sales: number | null
          plan_spend: number | null
          plan_visits: number | null
          project_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          month_year: string
          plan_leads?: number | null
          plan_revenue?: number | null
          plan_sales?: number | null
          plan_spend?: number | null
          plan_visits?: number | null
          project_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          month_year?: string
          plan_leads?: number | null
          plan_revenue?: number | null
          plan_sales?: number | null
          plan_spend?: number | null
          plan_visits?: number | null
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "monthly_plans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      neuro_characters: {
        Row: {
          created_at: string
          id: string
          name: string
          photo_urls: Json
          project_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          photo_urls?: Json
          project_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          photo_urls?: Json
          project_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      nps_feedback: {
        Row: {
          client_name: string | null
          clinic_name: string | null
          created_at: string | null
          feedback_text: string | null
          id: string
          is_resolved: boolean | null
          lead_id: string | null
          phone: string | null
          project_id: string | null
          score: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          client_name?: string | null
          clinic_name?: string | null
          created_at?: string | null
          feedback_text?: string | null
          id?: string
          is_resolved?: boolean | null
          lead_id?: string | null
          phone?: string | null
          project_id?: string | null
          score?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          client_name?: string | null
          clinic_name?: string | null
          created_at?: string | null
          feedback_text?: string | null
          id?: string
          is_resolved?: boolean | null
          lead_id?: string | null
          phone?: string | null
          project_id?: string | null
          score?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nps_feedback_project_id_fkey"
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
          office: string | null
          permissions: string[] | null
          phone: string | null
          role: string | null
          specialty: string | null
          updated_at: string
          working_days: string[] | null
          working_hours: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          office?: string | null
          permissions?: string[] | null
          phone?: string | null
          role?: string | null
          specialty?: string | null
          updated_at?: string
          working_days?: string[] | null
          working_hours?: string | null
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          office?: string | null
          permissions?: string[] | null
          phone?: string | null
          role?: string | null
          specialty?: string | null
          updated_at?: string
          working_days?: string[] | null
          working_hours?: string | null
        }
        Relationships: []
      }
      project_members: {
        Row: {
          id: string
          project_id: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          project_id?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          project_id?: string | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          currency: string | null
          id: string
          language: string | null
          logo_url: string | null
          name: string
          timezone: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          id?: string
          language?: string | null
          logo_url?: string | null
          name: string
          timezone?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          id?: string
          language?: string | null
          logo_url?: string | null
          name?: string
          timezone?: string | null
        }
        Relationships: []
      }
      retention_tasks: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string | null
          project_id: string | null
          promo_code: string | null
          sent_at: string | null
          status: string | null
          template_id: string | null
          trigger_date: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          project_id?: string | null
          promo_code?: string | null
          sent_at?: string | null
          status?: string | null
          template_id?: string | null
          trigger_date: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          project_id?: string | null
          promo_code?: string | null
          sent_at?: string | null
          status?: string | null
          template_id?: string | null
          trigger_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "retention_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retention_tasks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "retention_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      retention_templates: {
        Row: {
          created_at: string | null
          id: string
          message_prompt: string
          name: string
          project_id: string | null
          return_count: number | null
          revenue_generated: number | null
          sent_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_prompt: string
          name: string
          project_id?: string | null
          return_count?: number | null
          revenue_generated?: number | null
          sent_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message_prompt?: string
          name?: string
          project_id?: string | null
          return_count?: number | null
          revenue_generated?: number | null
          sent_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "retention_templates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      scoreboard_daily_facts: {
        Row: {
          clicks: number
          client_config_id: string | null
          created_at: string | null
          date: string
          followers: number
          id: string
          impressions: number
          leads: number
          project_id: string | null
          revenue: number
          sales: number
          spend: number
          visits: number
        }
        Insert: {
          clicks?: number
          client_config_id?: string | null
          created_at?: string | null
          date: string
          followers?: number
          id?: string
          impressions?: number
          leads?: number
          project_id?: string | null
          revenue?: number
          sales?: number
          spend?: number
          visits?: number
        }
        Update: {
          clicks?: number
          client_config_id?: string | null
          created_at?: string | null
          date?: string
          followers?: number
          id?: string
          impressions?: number
          leads?: number
          project_id?: string | null
          revenue?: number
          sales?: number
          spend?: number
          visits?: number
        }
        Relationships: [
          {
            foreignKeyName: "scoreboard_daily_facts_client_config_id_fkey"
            columns: ["client_config_id"]
            isOneToOne: false
            referencedRelation: "agency_metrics_view"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "scoreboard_daily_facts_client_config_id_fkey"
            columns: ["client_config_id"]
            isOneToOne: false
            referencedRelation: "clients_config"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scoreboard_daily_facts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      scoreboard_plans: {
        Row: {
          clicks: number
          client_config_id: string | null
          created_at: string | null
          followers: number
          id: string
          impressions: number
          leads: number
          month_index: number
          project_id: string | null
          revenue: number
          sales: number
          spend: number
          updated_at: string | null
          visits: number
          year: number
        }
        Insert: {
          clicks?: number
          client_config_id?: string | null
          created_at?: string | null
          followers?: number
          id?: string
          impressions?: number
          leads?: number
          month_index: number
          project_id?: string | null
          revenue?: number
          sales?: number
          spend?: number
          updated_at?: string | null
          visits?: number
          year: number
        }
        Update: {
          clicks?: number
          client_config_id?: string | null
          created_at?: string | null
          followers?: number
          id?: string
          impressions?: number
          leads?: number
          month_index?: number
          project_id?: string | null
          revenue?: number
          sales?: number
          spend?: number
          updated_at?: string | null
          visits?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "scoreboard_plans_client_config_id_fkey"
            columns: ["client_config_id"]
            isOneToOne: false
            referencedRelation: "agency_metrics_view"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "scoreboard_plans_client_config_id_fkey"
            columns: ["client_config_id"]
            isOneToOne: false
            referencedRelation: "clients_config"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scoreboard_plans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_insights: {
        Row: {
          created_at: string | null
          id: string
          impact_percent: number | null
          insight_text: string | null
          project_id: string | null
          recommendation_type: string | null
          recommended_points: number | null
          status: string | null
          suggested_field: string | null
          suggested_operator: string | null
          suggested_score_delta: number | null
          suggested_value: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          impact_percent?: number | null
          insight_text?: string | null
          project_id?: string | null
          recommendation_type?: string | null
          recommended_points?: number | null
          status?: string | null
          suggested_field?: string | null
          suggested_operator?: string | null
          suggested_score_delta?: number | null
          suggested_value?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          impact_percent?: number | null
          insight_text?: string | null
          project_id?: string | null
          recommendation_type?: string | null
          recommended_points?: number | null
          status?: string | null
          suggested_field?: string | null
          suggested_operator?: string | null
          suggested_score_delta?: number | null
          suggested_value?: string | null
        }
        Relationships: []
      }
      scoring_rules: {
        Row: {
          created_at: string | null
          criteria_name: string | null
          field: string | null
          id: string
          is_active: boolean | null
          operator: string | null
          points: number | null
          project_id: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          criteria_name?: string | null
          field?: string | null
          id?: string
          is_active?: boolean | null
          operator?: string | null
          points?: number | null
          project_id?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          criteria_name?: string | null
          field?: string | null
          id?: string
          is_active?: boolean | null
          operator?: string | null
          points?: number | null
          project_id?: string | null
          value?: string | null
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
      workflow_errors: {
        Row: {
          ad_account_id: string | null
          client_name: string | null
          created_at: string | null
          error_message: string | null
          error_type: string
          id: string
          input_data: Json | null
          node_name: string
          resolved: boolean | null
          workflow_id: string | null
          workflow_name: string | null
        }
        Insert: {
          ad_account_id?: string | null
          client_name?: string | null
          created_at?: string | null
          error_message?: string | null
          error_type: string
          id?: string
          input_data?: Json | null
          node_name: string
          resolved?: boolean | null
          workflow_id?: string | null
          workflow_name?: string | null
        }
        Update: {
          ad_account_id?: string | null
          client_name?: string | null
          created_at?: string | null
          error_message?: string | null
          error_type?: string
          id?: string
          input_data?: Json | null
          node_name?: string
          resolved?: boolean | null
          workflow_id?: string | null
          workflow_name?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      agency_metrics_view: {
        Row: {
          cac: number | null
          clicks: number | null
          client_id: string | null
          client_name: string | null
          cpl: number | null
          cpv: number | null
          followers: number | null
          impressions: number | null
          is_active: boolean | null
          is_agency: boolean | null
          meta_leads: number | null
          project_id: string | null
          revenue: number | null
          romi: number | null
          sales: number | null
          spend: number | null
          visits: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_config_project_id_fkey1"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      leads_crm: {
        Row: {
          ai_score: number | null
          ai_summary: string | null
          amount: number | null
          client_config_id: string | null
          created_at: string | null
          doctor_name: string | null
          external_lead_id: string | null
          extra_data: Json | null
          fb_ad_account_id: string | null
          fb_ad_id: string | null
          fb_adset_id: string | null
          fb_campaign_id: string | null
          id: string | null
          is_diagnostic: boolean | null
          lead_score: string | null
          name: string | null
          office_name: string | null
          phone: string | null
          pipeline: string | null
          prescribed_packages: string[] | null
          project_id: string | null
          refusal_reason: string | null
          scheduled_at: string | null
          score_label: string | null
          service_category: string | null
          serviced_by: string | null
          source: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          ai_score?: number | null
          ai_summary?: string | null
          amount?: number | null
          client_config_id?: string | null
          created_at?: string | null
          doctor_name?: string | null
          external_lead_id?: string | null
          extra_data?: Json | null
          fb_ad_account_id?: string | null
          fb_ad_id?: string | null
          fb_adset_id?: string | null
          fb_campaign_id?: string | null
          id?: string | null
          is_diagnostic?: boolean | null
          lead_score?: string | null
          name?: string | null
          office_name?: string | null
          phone?: string | null
          pipeline?: string | null
          prescribed_packages?: string[] | null
          project_id?: string | null
          refusal_reason?: string | null
          scheduled_at?: string | null
          score_label?: string | null
          service_category?: string | null
          serviced_by?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          ai_score?: number | null
          ai_summary?: string | null
          amount?: number | null
          client_config_id?: string | null
          created_at?: string | null
          doctor_name?: string | null
          external_lead_id?: string | null
          extra_data?: Json | null
          fb_ad_account_id?: string | null
          fb_ad_id?: string | null
          fb_adset_id?: string | null
          fb_campaign_id?: string | null
          id?: string | null
          is_diagnostic?: boolean | null
          lead_score?: string | null
          name?: string | null
          office_name?: string | null
          phone?: string | null
          pipeline?: string | null
          prescribed_packages?: string[] | null
          project_id?: string | null
          refusal_reason?: string | null
          scheduled_at?: string | null
          score_label?: string | null
          service_category?: string | null
          serviced_by?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
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
          {
            foreignKeyName: "leads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_analytics_view: {
        Row: {
          created_at: string | null
          leads: number | null
          project_id: string | null
          revenue: number | null
          sales: number | null
          service_category: string | null
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
      is_project_member: { Args: { _project_id: string }; Returns: boolean }
      recalculate_client_totals: {
        Args: { p_client_config_id: string }
        Returns: undefined
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

