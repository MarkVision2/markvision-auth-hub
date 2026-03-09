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
        Relationships: [
          {
            foreignKeyName: "chat_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
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
          meta_leads?: number | null
          page_id?: string | null
          page_name?: string | null
          pixel_event?: string | null
          project_id?: string | null
          region_key?: string | null
          spend?: number | null
          telegram_group_id?: string | null
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
          meta_leads?: number | null
          page_id?: string | null
          page_name?: string | null
          pixel_event?: string | null
          project_id?: string | null
          region_key?: string | null
          spend?: number | null
          telegram_group_id?: string | null
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
      daily_metrics: {
        Row: {
          clicks: number | null
          client_config_id: string | null
          created_at: string | null
          date: string
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
          spend: number | null
          visits: number | null
        }
        Insert: {
          clicks?: number | null
          client_config_id?: string | null
          created_at?: string | null
          date: string
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
          spend?: number | null
          visits?: number | null
        }
        Update: {
          clicks?: number | null
          client_config_id?: string | null
          created_at?: string | null
          date?: string
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
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_members: {
        Row: {
          id: string
          project_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          project_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          project_id?: string | null
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
      is_project_member: { Args: { _project_id: string }; Returns: boolean }
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
