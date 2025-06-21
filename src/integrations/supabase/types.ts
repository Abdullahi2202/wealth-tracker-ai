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
      admin_activity_logs: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          target_id: string | null
          target_table: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          target_id?: string | null
          target_table?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          target_id?: string | null
          target_table?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_credentials: {
        Row: {
          email: string
          password_hash: string
        }
        Insert: {
          email: string
          password_hash: string
        }
        Update: {
          email?: string
          password_hash?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          role: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      chatbot_conversations: {
        Row: {
          created_at: string | null
          id: string
          intent_detected: string | null
          message: string
          response: string | null
          response_time_ms: number | null
          satisfaction_score: number | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          intent_detected?: string | null
          message: string
          response?: string | null
          response_time_ms?: number | null
          satisfaction_score?: number | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          intent_detected?: string | null
          message?: string
          response?: string | null
          response_time_ms?: number | null
          satisfaction_score?: number | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      connect_accounts: {
        Row: {
          account_type: string
          charges_enabled: boolean | null
          created_at: string | null
          details_submitted: boolean | null
          id: string
          onboarding_url: string | null
          payouts_enabled: boolean | null
          stripe_account_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_type?: string
          charges_enabled?: boolean | null
          created_at?: string | null
          details_submitted?: boolean | null
          id?: string
          onboarding_url?: string | null
          payouts_enabled?: boolean | null
          stripe_account_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_type?: string
          charges_enabled?: boolean | null
          created_at?: string | null
          details_submitted?: boolean | null
          id?: string
          onboarding_url?: string | null
          payouts_enabled?: boolean | null
          stripe_account_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      fraud_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          description: string | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          risk_score: number | null
          status: string | null
          transaction_id: string | null
          user_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_score?: number | null
          status?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_score?: number | null
          status?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fraud_alerts_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_verification_requests: {
        Row: {
          created_at: string | null
          document_number: string
          document_type: string
          id: string
          image_url: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_email: string
        }
        Insert: {
          created_at?: string | null
          document_number: string
          document_type: string
          id?: string
          image_url: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_email: string
        }
        Update: {
          created_at?: string | null
          document_number?: string
          document_type?: string
          id?: string
          image_url?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_email?: string
        }
        Relationships: []
      }
      money_transfers: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          recipient_id: string | null
          sender_id: string | null
          status: string
          stripe_transfer_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          recipient_id?: string | null
          sender_id?: string | null
          status?: string
          stripe_transfer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          recipient_id?: string | null
          sender_id?: string | null
          status?: string
          stripe_transfer_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          brand: string | null
          created_at: string | null
          exp_month: number | null
          exp_year: number | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          label: string | null
          last4: string | null
          stripe_customer_id: string | null
          stripe_payment_method_id: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          brand?: string | null
          created_at?: string | null
          exp_month?: number | null
          exp_year?: number | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          label?: string | null
          last4?: string | null
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          type?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          brand?: string | null
          created_at?: string | null
          exp_month?: number | null
          exp_year?: number | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          label?: string | null
          last4?: string | null
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          metadata: Json | null
          payment_method: string | null
          processed_at: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          status: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payouts: {
        Row: {
          amount: number
          arrival_date: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          status: string
          stripe_payout_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          arrival_date?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          status: string
          stripe_payout_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          arrival_date?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          status?: string
          stripe_payout_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          image_url: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          image_url?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          image_url?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      registration: {
        Row: {
          created_at: string | null
          document_type: string | null
          email: string
          full_name: string
          id: string
          image_url: string | null
          passport_number: string | null
          password: string
          phone: string | null
          updated_at: string | null
          verification_status: string | null
        }
        Insert: {
          created_at?: string | null
          document_type?: string | null
          email: string
          full_name: string
          id?: string
          image_url?: string | null
          passport_number?: string | null
          password: string
          phone?: string | null
          updated_at?: string | null
          verification_status?: string | null
        }
        Update: {
          created_at?: string | null
          document_type?: string | null
          email?: string
          full_name?: string
          id?: string
          image_url?: string | null
          passport_number?: string | null
          password?: string
          phone?: string | null
          updated_at?: string | null
          verification_status?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      stripe_test_cards: {
        Row: {
          card_brand: string | null
          card_exp_month: number | null
          card_exp_year: number | null
          card_last4: string | null
          created_at: string | null
          id: string
          is_test: boolean | null
          label: string | null
          status: string | null
          stripe_customer_id: string
          stripe_payment_method_id: string
          stripe_setup_intent_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last4?: string | null
          created_at?: string | null
          id?: string
          is_test?: boolean | null
          label?: string | null
          status?: string | null
          stripe_customer_id: string
          stripe_payment_method_id: string
          stripe_setup_intent_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last4?: string | null
          created_at?: string | null
          id?: string
          is_test?: boolean | null
          label?: string | null
          status?: string | null
          stripe_customer_id?: string
          stripe_payment_method_id?: string
          stripe_setup_intent_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          description: string
          id: string
          priority: string | null
          resolved_at: string | null
          status: string | null
          subject: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          description: string
          id?: string
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          subject: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string
          id?: string
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          subject?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      system_metrics: {
        Row: {
          id: string
          metric_name: string
          metric_type: string
          metric_value: number
          recorded_at: string | null
        }
        Insert: {
          id?: string
          metric_name: string
          metric_type: string
          metric_value: number
          recorded_at?: string | null
        }
        Update: {
          id?: string
          metric_name?: string
          metric_type?: string
          metric_value?: number
          recorded_at?: string | null
        }
        Relationships: []
      }
      topup_sessions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          status: string
          stripe_session_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          status?: string
          stripe_session_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          status?: string
          stripe_session_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      transaction_logs: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string | null
          description: string | null
          id: string
          reference_id: string | null
          transaction_id: string | null
          transaction_type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          transaction_id?: string | null
          transaction_type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          transaction_id?: string | null
          transaction_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_logs_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          date: string | null
          id: string
          name: string
          note: string | null
          payment_method_id: string | null
          recipient_user_id: string | null
          sender_user_id: string | null
          status: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          date?: string | null
          id?: string
          name: string
          note?: string | null
          payment_method_id?: string | null
          recipient_user_id?: string | null
          sender_user_id?: string | null
          status?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          date?: string | null
          id?: string
          name?: string
          note?: string | null
          payment_method_id?: string | null
          recipient_user_id?: string | null
          sender_user_id?: string | null
          status?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number | null
          created_at: string | null
          currency: string | null
          id: string
          is_frozen: boolean | null
          updated_at: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          is_frozen?: boolean | null
          updated_at?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          is_frozen?: boolean | null
          updated_at?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_email_change_token_new: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_admin_login: {
        Args: { email_input: string; password_input: string }
        Returns: boolean
      }
      check_login: {
        Args: { email_input: string; password_input: string }
        Returns: boolean
      }
      check_user_role: {
        Args: { email_input: string }
        Returns: string
      }
      get_user_role: {
        Args: { user_uuid: string }
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_by_email: {
        Args: { _email: string }
        Returns: boolean
      }
      make_user_admin: {
        Args: { user_email: string }
        Returns: undefined
      }
      register_user: {
        Args: { email_input: string; password_input: string }
        Returns: undefined
      }
      set_admin_role: {
        Args: { email_input: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
