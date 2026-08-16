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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      avisos: {
        Row: {
          autor_id: string | null
          created_at: string
          cuerpo: string
          estado: Database["public"]["Enums"]["estado_publicacion"]
          fecha_evento: string | null
          id: string
          lugar: string | null
          titulo: string
          updated_at: string
          vereda_id: string
        }
        Insert: {
          autor_id?: string | null
          created_at?: string
          cuerpo?: string
          estado?: Database["public"]["Enums"]["estado_publicacion"]
          fecha_evento?: string | null
          id?: string
          lugar?: string | null
          titulo: string
          updated_at?: string
          vereda_id: string
        }
        Update: {
          autor_id?: string | null
          created_at?: string
          cuerpo?: string
          estado?: Database["public"]["Enums"]["estado_publicacion"]
          fecha_evento?: string | null
          id?: string
          lugar?: string | null
          titulo?: string
          updated_at?: string
          vereda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avisos_vereda_id_fkey"
            columns: ["vereda_id"]
            isOneToOne: false
            referencedRelation: "veredas"
            referencedColumns: ["id"]
          },
        ]
      }
      emergencias: {
        Row: {
          activa: boolean
          autor_id: string | null
          created_at: string
          descripcion: string
          estado: Database["public"]["Enums"]["estado_publicacion"]
          id: string
          severidad: Database["public"]["Enums"]["severidad"]
          titulo: string
          ubicacion: string | null
          updated_at: string
          vereda_id: string
        }
        Insert: {
          activa?: boolean
          autor_id?: string | null
          created_at?: string
          descripcion?: string
          estado?: Database["public"]["Enums"]["estado_publicacion"]
          id?: string
          severidad?: Database["public"]["Enums"]["severidad"]
          titulo: string
          ubicacion?: string | null
          updated_at?: string
          vereda_id: string
        }
        Update: {
          activa?: boolean
          autor_id?: string | null
          created_at?: string
          descripcion?: string
          estado?: Database["public"]["Enums"]["estado_publicacion"]
          id?: string
          severidad?: Database["public"]["Enums"]["severidad"]
          titulo?: string
          ubicacion?: string | null
          updated_at?: string
          vereda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergencias_vereda_id_fkey"
            columns: ["vereda_id"]
            isOneToOne: false
            referencedRelation: "veredas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          nombre: string
          telefono: string | null
          updated_at: string
          vereda_id: string | null
        }
        Insert: {
          created_at?: string
          id: string
          nombre?: string
          telefono?: string | null
          updated_at?: string
          vereda_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
          telefono?: string | null
          updated_at?: string
          vereda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_vereda_id_fkey"
            columns: ["vereda_id"]
            isOneToOne: false
            referencedRelation: "veredas"
            referencedColumns: ["id"]
          },
        ]
      }
      reportes: {
        Row: {
          autor_id: string
          created_at: string
          descripcion: string
          estado: Database["public"]["Enums"]["estado_reporte"]
          foto_url: string | null
          id: string
          nota_revision: string | null
          publicacion_id: string | null
          publicacion_tabla: string | null
          revisado_at: string | null
          revisado_por: string | null
          severidad: Database["public"]["Enums"]["severidad"]
          tipo: Database["public"]["Enums"]["tipo_reporte"]
          titulo: string
          ubicacion: string | null
          updated_at: string
          vereda_id: string
        }
        Insert: {
          autor_id: string
          created_at?: string
          descripcion?: string
          estado?: Database["public"]["Enums"]["estado_reporte"]
          foto_url?: string | null
          id?: string
          nota_revision?: string | null
          publicacion_id?: string | null
          publicacion_tabla?: string | null
          revisado_at?: string | null
          revisado_por?: string | null
          severidad?: Database["public"]["Enums"]["severidad"]
          tipo: Database["public"]["Enums"]["tipo_reporte"]
          titulo: string
          ubicacion?: string | null
          updated_at?: string
          vereda_id: string
        }
        Update: {
          autor_id?: string
          created_at?: string
          descripcion?: string
          estado?: Database["public"]["Enums"]["estado_reporte"]
          foto_url?: string | null
          id?: string
          nota_revision?: string | null
          publicacion_id?: string | null
          publicacion_tabla?: string | null
          revisado_at?: string | null
          revisado_por?: string | null
          severidad?: Database["public"]["Enums"]["severidad"]
          tipo?: Database["public"]["Enums"]["tipo_reporte"]
          titulo?: string
          ubicacion?: string | null
          updated_at?: string
          vereda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reportes_vereda_id_fkey"
            columns: ["vereda_id"]
            isOneToOne: false
            referencedRelation: "veredas"
            referencedColumns: ["id"]
          },
        ]
      }
      servicios: {
        Row: {
          autor_id: string | null
          created_at: string
          descripcion: string
          estado: Database["public"]["Enums"]["estado_publicacion"]
          estado_servicio: Database["public"]["Enums"]["estado_servicio"]
          fin_estimado: string | null
          id: string
          inicio_estimado: string | null
          tipo: Database["public"]["Enums"]["tipo_servicio"]
          updated_at: string
          vereda_id: string
        }
        Insert: {
          autor_id?: string | null
          created_at?: string
          descripcion?: string
          estado?: Database["public"]["Enums"]["estado_publicacion"]
          estado_servicio?: Database["public"]["Enums"]["estado_servicio"]
          fin_estimado?: string | null
          id?: string
          inicio_estimado?: string | null
          tipo: Database["public"]["Enums"]["tipo_servicio"]
          updated_at?: string
          vereda_id: string
        }
        Update: {
          autor_id?: string | null
          created_at?: string
          descripcion?: string
          estado?: Database["public"]["Enums"]["estado_publicacion"]
          estado_servicio?: Database["public"]["Enums"]["estado_servicio"]
          fin_estimado?: string | null
          id?: string
          inicio_estimado?: string | null
          tipo?: Database["public"]["Enums"]["tipo_servicio"]
          updated_at?: string
          vereda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "servicios_vereda_id_fkey"
            columns: ["vereda_id"]
            isOneToOne: false
            referencedRelation: "veredas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          vereda_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
          vereda_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
          vereda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_vereda_id_fkey"
            columns: ["vereda_id"]
            isOneToOne: false
            referencedRelation: "veredas"
            referencedColumns: ["id"]
          },
        ]
      }
      veredas: {
        Row: {
          created_at: string
          id: string
          municipio: string
          nombre: string
        }
        Insert: {
          created_at?: string
          id?: string
          municipio?: string
          nombre: string
        }
        Update: {
          created_at?: string
          id?: string
          municipio?: string
          nombre?: string
        }
        Relationships: []
      }
      vias: {
        Row: {
          autor_id: string | null
          created_at: string
          detalle: string
          estado: Database["public"]["Enums"]["estado_publicacion"]
          estado_via: Database["public"]["Enums"]["estado_via"]
          id: string
          nombre: string
          updated_at: string
          vereda_id: string
        }
        Insert: {
          autor_id?: string | null
          created_at?: string
          detalle?: string
          estado?: Database["public"]["Enums"]["estado_publicacion"]
          estado_via?: Database["public"]["Enums"]["estado_via"]
          id?: string
          nombre: string
          updated_at?: string
          vereda_id: string
        }
        Update: {
          autor_id?: string | null
          created_at?: string
          detalle?: string
          estado?: Database["public"]["Enums"]["estado_publicacion"]
          estado_via?: Database["public"]["Enums"]["estado_via"]
          id?: string
          nombre?: string
          updated_at?: string
          vereda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vias_vereda_id_fkey"
            columns: ["vereda_id"]
            isOneToOne: false
            referencedRelation: "veredas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_de: {
        Args: { _user_id: string; _vereda_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "habitante" | "admin"
      estado_publicacion: "publicado" | "archivado"
      estado_reporte: "pendiente" | "aprobado" | "rechazado"
      estado_servicio: "normal" | "intermitente" | "suspendido" | "restablecido"
      estado_via: "habilitada" | "precaucion" | "afectada" | "cerrada"
      severidad: "normal" | "precaucion" | "urgente"
      tipo_reporte: "emergencia" | "via" | "servicio" | "aviso"
      tipo_servicio: "agua" | "luz" | "senal"
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
      app_role: ["habitante", "admin"],
      estado_publicacion: ["publicado", "archivado"],
      estado_reporte: ["pendiente", "aprobado", "rechazado"],
      estado_servicio: ["normal", "intermitente", "suspendido", "restablecido"],
      estado_via: ["habilitada", "precaucion", "afectada", "cerrada"],
      severidad: ["normal", "precaucion", "urgente"],
      tipo_reporte: ["emergencia", "via", "servicio", "aviso"],
      tipo_servicio: ["agua", "luz", "senal"],
    },
  },
} as const
