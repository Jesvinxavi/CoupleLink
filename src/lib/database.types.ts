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
      activities: {
        Row: {
          category: Database["public"]["Enums"]["activity_category"] | null
          content: Json | null
          id: string
          type: Database["public"]["Enums"]["activity_type"] | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["activity_category"] | null
          content?: Json | null
          id?: string
          type?: Database["public"]["Enums"]["activity_type"] | null
        }
        Update: {
          category?: Database["public"]["Enums"]["activity_category"] | null
          content?: Json | null
          id?: string
          type?: Database["public"]["Enums"]["activity_type"] | null
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          category: string | null
          color: string | null
          country: string | null
          couple_id: string | null
          description: string | null
          end_date: string | null
          event_date: string | null
          id: string
          location: string | null
          recurrence: string | null
          title: string | null
        }
        Insert: {
          category?: string | null
          color?: string | null
          country?: string | null
          couple_id?: string | null
          description?: string | null
          end_date?: string | null
          event_date?: string | null
          id?: string
          location?: string | null
          recurrence?: string | null
          title?: string | null
        }
        Update: {
          category?: string | null
          color?: string | null
          country?: string | null
          couple_id?: string | null
          description?: string | null
          end_date?: string | null
          event_date?: string | null
          id?: string
          location?: string | null
          recurrence?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      completed_positions: {
        Row: {
          completed_at: string | null
          couple_id: string | null
          id: string
          position_id: string
        }
        Insert: {
          completed_at?: string | null
          couple_id?: string | null
          id?: string
          position_id: string
        }
        Update: {
          completed_at?: string | null
          couple_id?: string | null
          id?: string
          position_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "completed_positions_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      couples: {
        Row: {
          action_points: number | null
          anniversary_date: string | null
          archived_at: string | null
          challenge_stats: Json | null
          created_at: string | null
          current_streak: number | null
          daily_question_date: string | null
          daily_question_id: string | null
          id: string
          invite_code: string | null
          last_activity_date: string | null
          longest_streak: number | null
          previous_streak: number | null
          rain_check_tokens: number | null
          spicy_mode: boolean | null
          status: string | null
          total_love_points: number | null
          user_one_id: string | null
          user_two_id: string | null
        }
        Insert: {
          action_points?: number | null
          anniversary_date?: string | null
          archived_at?: string | null
          challenge_stats?: Json | null
          created_at?: string | null
          current_streak?: number | null
          daily_question_date?: string | null
          daily_question_id?: string | null
          id?: string
          invite_code?: string | null
          last_activity_date?: string | null
          longest_streak?: number | null
          previous_streak?: number | null
          rain_check_tokens?: number | null
          spicy_mode?: boolean | null
          status?: string | null
          total_love_points?: number | null
          user_one_id?: string | null
          user_two_id?: string | null
        }
        Update: {
          action_points?: number | null
          anniversary_date?: string | null
          archived_at?: string | null
          challenge_stats?: Json | null
          created_at?: string | null
          current_streak?: number | null
          daily_question_date?: string | null
          daily_question_id?: string | null
          id?: string
          invite_code?: string | null
          last_activity_date?: string | null
          longest_streak?: number | null
          previous_streak?: number | null
          rain_check_tokens?: number | null
          spicy_mode?: boolean | null
          status?: string | null
          total_love_points?: number | null
          user_one_id?: string | null
          user_two_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "couples_daily_question_id_fkey"
            columns: ["daily_question_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couples_user_one_id_fkey"
            columns: ["user_one_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couples_user_two_id_fkey"
            columns: ["user_two_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_templates: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          intensity: number | null
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          intensity?: number | null
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          intensity?: number | null
          title?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          acknowledged_at: string | null
          activated_at: string | null
          assigned_to: string | null
          couple_id: string
          created_at: string
          description: string | null
          expires_at: string | null
          gift_message: string | null
          gifted_by: string | null
          id: string
          is_gift: boolean | null
          redeemed_at: string | null
          status: string | null
          template_id: string | null
          title: string
        }
        Insert: {
          acknowledged_at?: string | null
          activated_at?: string | null
          assigned_to?: string | null
          couple_id: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          gift_message?: string | null
          gifted_by?: string | null
          id?: string
          is_gift?: boolean | null
          redeemed_at?: string | null
          status?: string | null
          template_id?: string | null
          title: string
        }
        Update: {
          acknowledged_at?: string | null
          activated_at?: string | null
          assigned_to?: string | null
          couple_id?: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          gift_message?: string | null
          gifted_by?: string | null
          id?: string
          is_gift?: boolean | null
          redeemed_at?: string | null
          status?: string | null
          template_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupons_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "coupon_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      fantasy_bucket_list: {
        Row: {
          completed_at: string | null
          couple_id: string | null
          created_at: string | null
          fantasy_text: string
          id: string
          requester_id: string | null
          responded_at: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          couple_id?: string | null
          created_at?: string | null
          fantasy_text: string
          id?: string
          requester_id?: string | null
          responded_at?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          couple_id?: string | null
          created_at?: string | null
          fantasy_text?: string
          id?: string
          requester_id?: string | null
          responded_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fantasy_bucket_list_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fantasy_bucket_list_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          couple_id: string
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          couple_id: string
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          couple_id?: string
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          couple_id: string
          created_at: string | null
          created_by: string
          current_round: number | null
          ended_at: string | null
          game_state: Json | null
          game_type: string
          id: string
          player_one_id: string | null
          player_one_joined_at: string | null
          player_two_id: string | null
          player_two_joined_at: string | null
          status: string
          total_rounds: number | null
        }
        Insert: {
          couple_id: string
          created_at?: string | null
          created_by: string
          current_round?: number | null
          ended_at?: string | null
          game_state?: Json | null
          game_type: string
          id?: string
          player_one_id?: string | null
          player_one_joined_at?: string | null
          player_two_id?: string | null
          player_two_joined_at?: string | null
          status?: string
          total_rounds?: number | null
        }
        Update: {
          couple_id?: string
          created_at?: string | null
          created_by?: string
          current_round?: number | null
          ended_at?: string | null
          game_state?: Json | null
          game_type?: string
          id?: string
          player_one_id?: string | null
          player_one_joined_at?: string | null
          player_two_id?: string | null
          player_two_joined_at?: string | null
          status?: string
          total_rounds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          memory_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          memory_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          memory_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_reactions_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memories"
            referencedColumns: ["id"]
          },
        ]
      }
      memories: {
        Row: {
          caption: string | null
          challenge_id: string | null
          country: string | null
          couple_id: string | null
          created_at: string
          folder_id: string | null
          id: string
          location: string | null
          media_url: string | null
          media_urls: string[] | null
          metadata: Json | null
          title: string | null
          type: string | null
          uploader_id: string | null
        }
        Insert: {
          caption?: string | null
          challenge_id?: string | null
          country?: string | null
          couple_id?: string | null
          created_at?: string
          folder_id?: string | null
          id?: string
          location?: string | null
          media_url?: string | null
          media_urls?: string[] | null
          metadata?: Json | null
          title?: string | null
          type?: string | null
          uploader_id?: string | null
        }
        Update: {
          caption?: string | null
          challenge_id?: string | null
          country?: string | null
          couple_id?: string | null
          created_at?: string
          folder_id?: string | null
          id?: string
          location?: string | null
          media_url?: string | null
          media_urls?: string[] | null
          metadata?: Json | null
          title?: string | null
          type?: string | null
          uploader_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memories_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memories_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memories_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          competition_points: number | null
          couple_id: string | null
          first_name: string | null
          id: string
          is_premium: boolean | null
          last_name: string | null
          last_seen_daily_question_at: string | null
          last_seen_rain_check_tokens: number | null
          last_seen_fantasies: string | null
          last_seen_fantasy_pending: string | null
          last_seen_fantasy_approved: string | null
          last_seen_fantasy_completed: string | null
          last_seen_coupons: string | null
          notification_preferences: Json | null
          onboarding_completed: boolean | null
          timezone: string | null
          unclaimed_vouchers: number | null
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          competition_points?: number | null
          couple_id?: string | null
          first_name?: string | null
          id: string
          is_premium?: boolean | null
          last_name?: string | null
          last_seen_daily_question_at?: string | null
          last_seen_rain_check_tokens?: number | null
          notification_preferences?: Json | null
          onboarding_completed?: boolean | null
          timezone?: string | null
          unclaimed_vouchers?: number | null
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          competition_points?: number | null
          couple_id?: string | null
          first_name?: string | null
          id?: string
          is_premium?: boolean | null
          last_name?: string | null
          last_seen_daily_question_at?: string | null
          last_seen_rain_check_tokens?: number | null
          notification_preferences?: Json | null
          onboarding_completed?: boolean | null
          timezone?: string | null
          unclaimed_vouchers?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      push_notification_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          notification_type: string
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          notification_type: string
          status: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          notification_type?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          keys_auth: string
          keys_p256dh: string
          last_used_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          keys_auth: string
          keys_p256dh: string
          last_used_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          keys_auth?: string
          keys_p256dh?: string
          last_used_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sex_counter: {
        Row: {
          count: number | null
          couple_id: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          count?: number | null
          couple_id?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          count?: number | null
          couple_id?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sex_counter_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: true
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      user_answers: {
        Row: {
          activity_id: string | null
          answer_text: string | null
          couple_id: string | null
          created_at: string | null
          drawing_data: Json | null
          id: string
          user_id: string | null
        }
        Insert: {
          activity_id?: string | null
          answer_text?: string | null
          couple_id?: string | null
          created_at?: string | null
          drawing_data?: Json | null
          id?: string
          user_id?: string | null
        }
        Update: {
          activity_id?: string | null
          answer_text?: string | null
          couple_id?: string | null
          created_at?: string | null
          drawing_data?: Json | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_answers_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_answers_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_dates: {
        Row: {
          checklist: string[] | null
          cost: string
          couple_id: string
          created_at: string
          description: string
          duration: string
          id: string
          image_url: string | null
          title: string
        }
        Insert: {
          checklist?: string[] | null
          cost: string
          couple_id: string
          created_at?: string
          description: string
          duration: string
          id?: string
          image_url?: string | null
          title: string
        }
        Update: {
          checklist?: string[] | null
          cost?: string
          couple_id?: string
          created_at?: string
          description?: string
          duration?: string
          id?: string
          image_url?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_dates_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_action_points: {
        Args: { p_couple_id: string; p_points: number }
        Returns: undefined
      }
      add_competition_points: {
        Args: { p_points: number; p_user_id: string }
        Returns: undefined
      }
      add_love_action_points: {
        Args: { p_couple_id: string; p_points: number }
        Returns: Json
      }
      add_monthly_rain_check: { Args: never; Returns: undefined }
      calculate_streak: {
        Args: { p_couple_id: string }
        Returns: {
          current_streak: number
          longest_streak: number
        }[]
      }
      check_and_update_streak: { Args: { p_couple_id: string }; Returns: Json }
      check_archived_couple: { Args: { partner_email: string }; Returns: Json }
      check_existing_archive_for_pair: { Args: never; Returns: Json }
      check_streak_broken: { Args: { p_couple_id: string }; Returns: Json }
      get_active_challenge: {
        Args: { couple_id_input: string; frequency_input: string }
        Returns: Json
      }
      get_daily_question: { Args: { couple_id_input: string }; Returns: Json }
      get_on_this_day_contents: {
        Args: {
          p_couple_id: string
          p_day: number
          p_month: number
          p_timezone?: string
        }
        Returns: {
          content: string
          created_at: string
          extra_data: Json
          id: string
          location: string
          media_urls: string[]
          title: string
          type: string
          uploader_id: string
        }[]
      }
      get_random_throwback: {
        Args: { p_couple_id: string; p_exclude_date?: string; p_seed: number }
        Returns: {
          content: string
          created_at: string
          extra_data: Json
          id: string
          location: string
          media_urls: string[]
          title: string
          type: string
          uploader_id: string
        }[]
      }
      get_user_couple_id: { Args: never; Returns: string }
      increment_couple_streak: {
        Args: { p_couple_id: string }
        Returns: undefined
      }
      initialize_notification_preferences: { Args: never; Returns: undefined }
      join_couple: { Args: { invite_code_input: string }; Returns: Json }
      refund_rain_check_token: {
        Args: { p_couple_id: string }
        Returns: boolean
      }
      reset_profile: { Args: never; Returns: undefined }
      restore_archived_and_delete_current: {
        Args: { archived_id: string }
        Returns: undefined
      }
      restore_couple: { Args: { target_couple_id: string }; Returns: undefined }
      restore_streak: { Args: { p_couple_id: string }; Returns: boolean }
      unpair_couple: { Args: never; Returns: undefined }
      unskip_challenge: {
        Args: {
          p_couple_id: string
          p_end_date: string
          p_start_date: string
          p_title: string
          p_type: string
        }
        Returns: boolean
      }
      upgrade_to_premium: { Args: never; Returns: undefined }
      use_rain_check: { Args: { p_couple_id: string }; Returns: boolean }
      use_rain_check_token: { Args: { p_couple_id: string }; Returns: boolean }
    }
    Enums: {
      activity_category:
      | "fun"
      | "deep"
      | "spicy"
      | "date_idea"
      | "romantic"
      | "creative"
      | "active"
      activity_type: "quiz" | "draw" | "challenge"
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
      activity_category: [
        "fun",
        "deep",
        "spicy",
        "date_idea",
        "romantic",
        "creative",
        "active",
      ],
      activity_type: ["quiz", "draw", "challenge"],
    },
  },
} as const
