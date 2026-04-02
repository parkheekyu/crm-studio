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
      campaigns: {
        Row: {
          created_at: string
          fail_count: number
          id: string
          kakao_options: Json | null
          message_content: string
          message_type: string
          name: string
          scheduled_at: string | null
          sent_at: string | null
          status: string
          success_count: number
          target_filter: Json | null
          total_count: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          fail_count?: number
          id?: string
          kakao_options?: Json | null
          message_content?: string
          message_type?: string
          name: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          success_count?: number
          target_filter?: Json | null
          total_count?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          fail_count?: number
          id?: string
          kakao_options?: Json | null
          message_content?: string
          message_type?: string
          name?: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          success_count?: number
          target_filter?: Json | null
          total_count?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          campaign_id: string | null
          created_at: string
          description: string | null
          id: string
          type: string
          workspace_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          campaign_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          type: string
          workspace_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          campaign_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_forms: {
        Row: {
          created_at: string
          description: string | null
          fields: Json
          id: string
          images: Json
          is_active: boolean
          lead_source_id: string | null
          pixel_id: string | null
          settings: Json
          slug: string
          thank_you_type: string
          thank_you_value: string | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          fields?: Json
          id?: string
          images?: Json
          is_active?: boolean
          lead_source_id?: string | null
          pixel_id?: string | null
          settings?: Json
          slug: string
          thank_you_type?: string
          thank_you_value?: string | null
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          fields?: Json
          id?: string
          images?: Json
          is_active?: boolean
          lead_source_id?: string | null
          pixel_id?: string | null
          settings?: Json
          slug?: string
          thank_you_type?: string
          thank_you_value?: string | null
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "landing_forms_lead_source_id_fkey"
            columns: ["lead_source_id"]
            isOneToOne: false
            referencedRelation: "lead_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_forms_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_group_memberships: {
        Row: {
          added_at: string
          group_id: string
          id: string
          lead_id: string
        }
        Insert: {
          added_at?: string
          group_id: string
          id?: string
          lead_id: string
        }
        Update: {
          added_at?: string
          group_id?: string
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_group_memberships_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "lead_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_group_memberships_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_groups: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          workspace_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          workspace_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_groups_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_sources: {
        Row: {
          config: Json
          created_at: string
          fields: Json
          group_id: string | null
          id: string
          is_active: boolean
          title: string
          type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          fields?: Json
          group_id?: string | null
          id?: string
          is_active?: boolean
          title: string
          type?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          fields?: Json
          group_id?: string | null
          id?: string
          is_active?: boolean
          title?: string
          type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_sources_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "lead_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_sources_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string
          source: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone: string
          source?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          source?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      message_logs: {
        Row: {
          campaign_id: string
          created_at: string
          error_message: string | null
          id: string
          lead_id: string | null
          lead_name: string | null
          phone: string
          sent_at: string | null
          solapi_message_id: string | null
          status: string
          workspace_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          lead_id?: string | null
          lead_name?: string | null
          phone: string
          sent_at?: string | null
          solapi_message_id?: string | null
          status?: string
          workspace_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          lead_id?: string | null
          lead_name?: string | null
          phone?: string
          sent_at?: string | null
          solapi_message_id?: string | null
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      message_pricing: {
        Row: {
          id: string
          label: string
          message_type: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          id?: string
          label: string
          message_type: string
          unit_price: number
          updated_at?: string
        }
        Update: {
          id?: string
          label?: string
          message_type?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      scenario_enrollments: {
        Row: {
          completed_at: string | null
          current_step: number
          enrolled_at: string
          id: string
          lead_id: string
          scenario_id: string
          status: string
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          current_step?: number
          enrolled_at?: string
          id?: string
          lead_id: string
          scenario_id: string
          status?: string
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          current_step?: number
          enrolled_at?: string
          id?: string
          lead_id?: string
          scenario_id?: string
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenario_enrollments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenario_enrollments_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenario_enrollments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      scenario_logs: {
        Row: {
          created_at: string
          enrollment_id: string | null
          error_message: string | null
          id: string
          lead_id: string
          lead_name: string | null
          phone: string
          sent_at: string | null
          status: string
          step_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          enrollment_id?: string | null
          error_message?: string | null
          id?: string
          lead_id: string
          lead_name?: string | null
          phone: string
          sent_at?: string | null
          status?: string
          step_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          enrollment_id?: string | null
          error_message?: string | null
          id?: string
          lead_id?: string
          lead_name?: string | null
          phone?: string
          sent_at?: string | null
          status?: string
          step_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenario_logs_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "scenario_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenario_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenario_logs_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "scenario_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenario_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      scenario_steps: {
        Row: {
          created_at: string
          delay_days: number
          id: string
          kakao_options: Json | null
          message_content: string
          message_type: string
          scenario_id: string
          scheduled_at: string | null
          step_order: number
          target_filter: Json | null
          template_id: string | null
          variable_bindings: Json | null
        }
        Insert: {
          created_at?: string
          delay_days?: number
          id?: string
          kakao_options?: Json | null
          message_content?: string
          message_type?: string
          scenario_id: string
          scheduled_at?: string | null
          step_order?: number
          target_filter?: Json | null
          template_id?: string | null
          variable_bindings?: Json | null
        }
        Update: {
          created_at?: string
          delay_days?: number
          id?: string
          kakao_options?: Json | null
          message_content?: string
          message_type?: string
          scenario_id?: string
          scheduled_at?: string | null
          step_order?: number
          target_filter?: Json | null
          template_id?: string | null
          variable_bindings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "scenario_steps_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      scenarios: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          scenario_type: string
          send_time: string | null
          trigger_filter: Json | null
          trigger_type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          scenario_type?: string
          send_time?: string | null
          trigger_filter?: Json | null
          trigger_type?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          scenario_type?: string
          send_time?: string | null
          trigger_filter?: Json | null
          trigger_type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenarios_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_api_keys: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_api_keys_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_credits: {
        Row: {
          auto_recharge: boolean
          auto_recharge_amount: number | null
          auto_recharge_threshold: number | null
          balance: number
          created_at: string
          id: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          auto_recharge?: boolean
          auto_recharge_amount?: number | null
          auto_recharge_threshold?: number | null
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          auto_recharge?: boolean
          auto_recharge_amount?: number | null
          auto_recharge_threshold?: number | null
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_credits_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_integrations: {
        Row: {
          config: Json
          created_at: string
          id: string
          provider: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          provider: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          provider?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_integrations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_kakao_channels: {
        Row: {
          category_code: string | null
          channel_name: string
          created_at: string
          id: string
          is_active: boolean
          pf_id: string
          search_id: string
          workspace_id: string
        }
        Insert: {
          category_code?: string | null
          channel_name: string
          created_at?: string
          id?: string
          is_active?: boolean
          pf_id: string
          search_id: string
          workspace_id: string
        }
        Update: {
          category_code?: string | null
          channel_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
          pf_id?: string
          search_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_kakao_channels_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          plan: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          plan?: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          plan?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
