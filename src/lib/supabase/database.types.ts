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
      areas: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          activity: string
          area_id: string | null
          created_at: string
          date: string
          grade_id: string | null
          hour_id: string
          id: string
          section_id: string | null
          teacher_id: string
          type: Database["public"]["Enums"]["booking_type"]
        }
        Insert: {
          activity: string
          area_id?: string | null
          created_at?: string
          date: string
          grade_id?: string | null
          hour_id: string
          id?: string
          section_id?: string | null
          teacher_id: string
          type: Database["public"]["Enums"]["booking_type"]
        }
        Update: {
          activity?: string
          area_id?: string | null
          created_at?: string
          date?: string
          grade_id?: string | null
          hour_id?: string
          id?: string
          section_id?: string | null
          teacher_id?: string
          type?: Database["public"]["Enums"]["booking_type"]
        }
        Relationships: [
          {
            foreignKeyName: "bookings_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_hour_id_fkey"
            columns: ["hour_id"]
            isOneToOne: false
            referencedRelation: "pedagogical_hours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          type: Database["public"]["Enums"]["category_type"]
        }
        Insert: {
          color: string
          created_at?: string
          id?: string
          name: string
          type: Database["public"]["Enums"]["category_type"]
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["category_type"]
        }
        Relationships: []
      }
      grades: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      loan_resources: {
        Row: {
          id: string
          loan_id: string
          resource_id: string
        }
        Insert: {
          id?: string
          loan_id: string
          resource_id: string
        }
        Update: {
          id?: string
          loan_id?: string
          resource_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_resources_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_resources_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          actual_return_date: string | null
          area_id: string
          created_at: string
          days_overdue: number | null
          grade_id: string
          id: string
          is_authorized: boolean
          loan_date: string
          notes: string | null
          return_date: string | null
          section_id: string
          status: Database["public"]["Enums"]["loan_status"]
          teacher_id: string
        }
        Insert: {
          actual_return_date?: string | null
          area_id: string
          created_at?: string
          days_overdue?: number | null
          grade_id: string
          id?: string
          is_authorized?: boolean
          loan_date?: string
          notes?: string | null
          return_date?: string | null
          section_id: string
          status?: Database["public"]["Enums"]["loan_status"]
          teacher_id: string
        }
        Update: {
          actual_return_date?: string | null
          area_id?: string
          created_at?: string
          days_overdue?: number | null
          grade_id?: string
          id?: string
          is_authorized?: boolean
          loan_date?: string
          notes?: string | null
          return_date?: string | null
          section_id?: string
          status?: Database["public"]["Enums"]["loan_status"]
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_participant_groups: {
        Row: {
          created_at: string
          group_name: string
          id: string
          meeting_id: string
        }
        Insert: {
          created_at?: string
          group_name: string
          id?: string
          meeting_id: string
        }
        Update: {
          created_at?: string
          group_name?: string
          id?: string
          meeting_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_participant_groups_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_tasks: {
        Row: {
          created_at: string
          id: string
          meeting_id: string
          notes: string | null
          responsible_id: string
          status: Database["public"]["Enums"]["task_status"]
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          meeting_id: string
          notes?: string | null
          responsible_id: string
          status?: Database["public"]["Enums"]["task_status"]
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          meeting_id?: string
          notes?: string | null
          responsible_id?: string
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_tasks_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_tasks_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          created_at: string
          date: string
          id: string
          title: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          title: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      pedagogical_hours: {
        Row: {
          created_at: string
          hour_order: number
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          hour_order: number
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          hour_order?: number
          id?: string
          name?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          brand: string | null
          category_id: string
          created_at: string
          generation: string | null
          id: string
          model: string | null
          notes: string | null
          number: number
          processor_brand: string | null
          ram: string | null
          status: Database["public"]["Enums"]["resource_status"]
          storage: string | null
        }
        Insert: {
          brand?: string | null
          category_id: string
          created_at?: string
          generation?: string | null
          id?: string
          model?: string | null
          notes?: string | null
          number: number
          processor_brand?: string | null
          ram?: string | null
          status?: Database["public"]["Enums"]["resource_status"]
          storage?: string | null
        }
        Update: {
          brand?: string | null
          category_id?: string
          created_at?: string
          generation?: string | null
          id?: string
          model?: string | null
          notes?: string | null
          number?: number
          processor_brand?: string | null
          ram?: string | null
          status?: Database["public"]["Enums"]["resource_status"]
          storage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      sections: {
        Row: {
          created_at: string
          grade_id: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          grade_id: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          grade_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "sections_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          allow_registration: boolean
          created_at: string
          updated_at: string
          id: number
          app_name: string
          app_logo_url: string | null
          primary_color: string
          accent_color: string
          theme_preset: string
        }
        Insert: {
          allow_registration?: boolean
          created_at?: string
          updated_at?: string
          id?: number
          app_name?: string
          app_logo_url?: string | null
          primary_color?: string
          accent_color?: string
          theme_preset?: string
        }
        Update: {
          allow_registration?: boolean
          created_at?: string
          updated_at?: string
          id?: number
          app_name?: string
          app_logo_url?: string | null
          primary_color?: string
          accent_color?: string
          theme_preset?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          dni: string
          email: string | null
          id: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          dni: string
          email?: string | null
          id: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          dni?: string | null
          email?: string | null
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          id: string
          resource_id: string
          reported_by: string | null
          title: string
          description: string | null
          status: string

          type: string
          resolved_by: string | null
          resolved_at: string | null
          resolution_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          resource_id: string
          reported_by?: string | null
          title: string
          description?: string | null
          status?: string

          type?: string
          resolved_by?: string | null
          resolved_at?: string | null
          resolution_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          resource_id?: string
          reported_by?: string | null
          title?: string
          description?: string | null
          status?: string

          type?: string
          resolved_by?: string | null
          resolved_at?: string | null
          resolution_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      equipment_history: {
        Row: {
          id: string
          resource_id: string
          event_type: string
          event_description: string
          performed_by: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          resource_id: string
          event_type: string
          event_description: string
          performed_by?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          resource_id?: string
          event_type?: string
          event_description?: string
          performed_by?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_history_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_history_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      maintenance_incidents: {
        Row: {
          id: string
          maintenance_id: string
          incident_id: string
          created_at: string
        }
        Insert: {
          id?: string
          maintenance_id: string
          incident_id: string
          created_at?: string
        }
        Update: {
          id?: string
          maintenance_id?: string
          incident_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_incidents_maintenance_id_fkey"
            columns: ["maintenance_id"]
            isOneToOne: false
            referencedRelation: "maintenance_tracking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_incidents_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          }
        ]
      }
      maintenance_tracking: {
        Row: {
          id: string
          resource_id: string
          user_id: string | null
          maintenance_type: string
          incident_category: string | null
          incident_description: string | null
          current_status: string
          estimated_completion_date: string | null
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          resource_id: string
          user_id?: string | null
          maintenance_type: string
          incident_category?: string | null
          incident_description?: string | null
          current_status?: string
          estimated_completion_date?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          resource_id?: string
          user_id?: string | null
          maintenance_type?: string
          incident_category?: string | null
          incident_description?: string | null
          current_status?: string
          estimated_completion_date?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_tracking_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      maintenance_status_history: {
        Row: {
          id: string
          maintenance_id: string
          previous_status: string | null
          new_status: string
          changed_by: string | null
          change_reason: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          maintenance_id: string
          previous_status?: string | null
          new_status: string
          changed_by?: string | null
          change_reason?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          maintenance_id?: string
          previous_status?: string | null
          new_status?: string
          changed_by?: string | null
          change_reason?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_status_history_maintenance_id_fkey"
            columns: ["maintenance_id"]
            isOneToOne: false
            referencedRelation: "maintenance_tracking"
            referencedColumns: ["id"]
          }
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
      booking_type: "STUDENT" | "INSTITUTIONAL"
      category_type:
        | "Laptops"
        | "Tablets"
        | "Proyectores"
        | "Cámaras Fotográficas"
        | "Filmadoras"
        | "Periféricos"
        | "Redes"
        | "Cables y Adaptadores"
        | "Audio"
        | "PCs de Escritorio"
        | "Mobiliario"
        | "Otros"
      loan_status: "Pendiente" | "Activo" | "Devuelto" | "Atrasado"
      resource_status:
        | "Disponible"
        | "En Préstamo"
        | "En Mantenimiento"
        | "Dañado"
        | "En Reparación"
        | "Parcialmente Reparado"
        | "Esperando Repuestos"
        | "Reparado - Pendiente Prueba"
      task_status: "Pendiente" | "En Progreso" | "Completada"
      user_role: "Administrador" | "Docente"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

    

    
