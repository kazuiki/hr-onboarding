export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'hr_manager' | 'hr_assistant' | 'employee';
export type TaskStatus = 'not_started' | 'in_progress' | 'submitted' | 'needs_changes' | 'approved';
export type EmployeeStatus = 'active' | 'completed' | 'archived';
export type TaskCategory =
  | 'welcome'
  | 'form'
  | 'photo'
  | 'document'
  | 'medical'
  | 'first_day'
  | 'privacy'
  | 'help'
  | 'completion';
export type HelpStatus = 'open' | 'in_progress' | 'resolved';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          role: UserRole;
          full_name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: UserRole;
          full_name: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: UserRole;
          full_name?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      employees: {
        Row: {
          id: string;
          employee_number: string;
          position: string;
          department: string;
          manager_name: string;
          start_date: string;
          access_window_days: number;
          status: EmployeeStatus;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          employee_number: string;
          position: string;
          department: string;
          manager_name: string;
          start_date: string;
          access_window_days?: number;
          status?: EmployeeStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_number?: string;
          position?: string;
          department?: string;
          manager_name?: string;
          start_date?: string;
          access_window_days?: number;
          status?: EmployeeStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      onboarding_templates: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          department: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          department?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          department?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      template_tasks: {
        Row: {
          id: string;
          template_id: string;
          title: string;
          description: string | null;
          category: TaskCategory;
          required: boolean;
          display_order: number;
          config: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          template_id: string;
          title: string;
          description?: string | null;
          category: TaskCategory;
          required?: boolean;
          display_order?: number;
          config?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          template_id?: string;
          title?: string;
          description?: string | null;
          category?: TaskCategory;
          required?: boolean;
          display_order?: number;
          config?: Json;
          created_at?: string;
        };
      };
      onboarding_packets: {
        Row: {
          id: string;
          employee_id: string;
          template_id: string | null;
          welcome_message: string;
          completion_percentage: number;
          has_watched_orientation: boolean;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          template_id?: string | null;
          welcome_message?: string;
          completion_percentage?: number;
          has_watched_orientation?: boolean;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          template_id?: string | null;
          welcome_message?: string;
          completion_percentage?: number;
          has_watched_orientation?: boolean;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      onboarding_tasks: {
        Row: {
          id: string;
          packet_id: string;
          employee_id: string;
          title: string;
          description: string | null;
          category: TaskCategory;
          status: TaskStatus;
          required: boolean;
          display_order: number;
          feedback: string | null;
          submitted_at: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          config: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          packet_id: string;
          employee_id: string;
          title: string;
          description?: string | null;
          category: TaskCategory;
          status?: TaskStatus;
          required?: boolean;
          display_order?: number;
          feedback?: string | null;
          submitted_at?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          config?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          packet_id?: string;
          employee_id?: string;
          title?: string;
          description?: string | null;
          category?: TaskCategory;
          status?: TaskStatus;
          required?: boolean;
          display_order?: number;
          feedback?: string | null;
          submitted_at?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          config?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      document_submissions: {
        Row: {
          id: string;
          task_id: string;
          employee_id: string;
          requirement_name: string;
          file_name: string;
          file_path: string;
          file_size: number;
          mime_type: string;
          status: TaskStatus;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          employee_id: string;
          requirement_name: string;
          file_name: string;
          file_path: string;
          file_size: number;
          mime_type: string;
          status?: TaskStatus;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          employee_id?: string;
          requirement_name?: string;
          file_name?: string;
          file_path?: string;
          file_size?: number;
          mime_type?: string;
          status?: TaskStatus;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      photo_submissions: {
        Row: {
          id: string;
          task_id: string;
          employee_id: string;
          file_path: string;
          file_size: number;
          mime_type: string;
          status: TaskStatus;
          feedback: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          employee_id: string;
          file_path: string;
          file_size: number;
          mime_type: string;
          status?: TaskStatus;
          feedback?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          employee_id?: string;
          file_path?: string;
          file_size?: number;
          mime_type?: string;
          status?: TaskStatus;
          feedback?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      form_submissions: {
        Row: {
          id: string;
          task_id: string;
          employee_id: string;
          form_type: string;
          form_data: Json;
          status: TaskStatus;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          employee_id: string;
          form_type: string;
          form_data: Json;
          status?: TaskStatus;
          submitted_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          employee_id?: string;
          form_type?: string;
          form_data?: Json;
          status?: TaskStatus;
          submitted_at?: string;
        };
      };
      medical_records: {
        Row: {
          id: string;
          employee_id: string;
          clinic_name: string;
          clinic_address: string;
          clinic_schedule: string;
          expense_notes: string;
          referral_doc_path: string | null;
          proof_doc_path: string | null;
          status: TaskStatus;
          feedback: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          clinic_name?: string;
          clinic_address?: string;
          clinic_schedule?: string;
          expense_notes?: string;
          referral_doc_path?: string | null;
          proof_doc_path?: string | null;
          status?: TaskStatus;
          feedback?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          clinic_name?: string;
          clinic_address?: string;
          clinic_schedule?: string;
          expense_notes?: string;
          referral_doc_path?: string | null;
          proof_doc_path?: string | null;
          status?: TaskStatus;
          feedback?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      first_day_guides: {
        Row: {
          id: string;
          employee_id: string;
          office_name: string;
          office_address: string;
          arrival_time: string;
          dress_code: string;
          reporting_to: string;
          items_to_bring: string[];
          intro_video_url: string;
          map_instructions: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          office_name?: string;
          office_address?: string;
          arrival_time?: string;
          dress_code?: string;
          reporting_to?: string;
          items_to_bring?: string[];
          intro_video_url?: string;
          map_instructions?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          office_name?: string;
          office_address?: string;
          arrival_time?: string;
          dress_code?: string;
          reporting_to?: string;
          items_to_bring?: string[];
          intro_video_url?: string;
          map_instructions?: string;
          created_at?: string;
        };
      };
      privacy_policies: {
        Row: {
          id: string;
          version: string;
          title: string;
          content: string;
          effective_date: string;
          is_current: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          version: string;
          title: string;
          content: string;
          effective_date: string;
          is_current?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          version?: string;
          title?: string;
          content?: string;
          effective_date?: string;
          is_current?: boolean;
          created_at?: string;
        };
      };
      privacy_acknowledgements: {
        Row: {
          id: string;
          employee_id: string;
          policy_id: string;
          policy_version: string;
          acknowledged_at: string;
          ip_address: string | null;
          user_agent: string | null;
        };
        Insert: {
          id?: string;
          employee_id: string;
          policy_id: string;
          policy_version: string;
          acknowledged_at?: string;
          ip_address?: string | null;
          user_agent?: string | null;
        };
        Update: {
          id?: string;
          employee_id?: string;
          policy_id?: string;
          policy_version?: string;
          acknowledged_at?: string;
          ip_address?: string | null;
          user_agent?: string | null;
        };
      };
      help_requests: {
        Row: {
          id: string;
          employee_id: string;
          subject: string;
          message: string;
          status: HelpStatus;
          hr_response: string | null;
          responded_by: string | null;
          responded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          subject: string;
          message: string;
          status?: HelpStatus;
          hr_response?: string | null;
          responded_by?: string | null;
          responded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          subject?: string;
          message?: string;
          status?: HelpStatus;
          hr_response?: string | null;
          responded_by?: string | null;
          responded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_events: {
        Row: {
          id: string;
          actor_id: string | null;
          actor_role: UserRole;
          action: string;
          target_type: string;
          target_id: string | null;
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          actor_role: UserRole;
          action: string;
          target_type: string;
          target_id?: string | null;
          details?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          actor_role?: UserRole;
          action?: string;
          target_type?: string;
          target_id?: string | null;
          details?: Json;
          created_at?: string;
        };
      };
    };
  };
}
