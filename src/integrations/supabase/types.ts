export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      avisos: {
        Row: {
          cerrado_en: string | null;
          creado_por: string | null;
          created_at: string;
          descripcion: string | null;
          fecha: string | null;
          id: string;
          lugar: string | null;
          razon_cierre: string | null;
          resultado: string | null;
          titulo: string;
          vereda_id: string;
        };
        Insert: {
          cerrado_en?: string | null;
          creado_por?: string | null;
          created_at?: string;
          descripcion?: string | null;
          fecha?: string | null;
          id?: string;
          lugar?: string | null;
          razon_cierre?: string | null;
          resultado?: string | null;
          titulo: string;
          vereda_id: string;
        };
        Update: {
          cerrado_en?: string | null;
          creado_por?: string | null;
          created_at?: string;
          descripcion?: string | null;
          fecha?: string | null;
          id?: string;
          lugar?: string | null;
          razon_cierre?: string | null;
          resultado?: string | null;
          titulo?: string;
          vereda_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "avisos_creado_por_fkey";
            columns: ["creado_por"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "avisos_vereda_id_fkey";
            columns: ["vereda_id"];
            isOneToOne: false;
            referencedRelation: "veredas";
            referencedColumns: ["id"];
          },
        ];
      };
      emergencias: {
        Row: {
          cerrado_en: string | null;
          foto_url: string | null;
          razon_cierre: string | null;
          resultado: string | null;
          creado_por: string | null;
          created_at: string;
          descripcion: string | null;
          estado: string;
          id: string;
          lugar: string | null;
          nivel: string;
          titulo: string;
          vereda_id: string;
        };
        Insert: {
          creado_por?: string | null;
          created_at?: string;
          descripcion?: string | null;
          estado?: string;
          id?: string;
          lugar?: string | null;
          nivel: string;
          titulo: string;
          vereda_id: string;
          foto_url: string | null;
          razon_cierre: string | null;
          resultado: string | null;
        };
        Update: {
          creado_por?: string | null;
          created_at?: string;
          descripcion?: string | null;
          estado?: string;
          id?: string;
          lugar?: string | null;
          nivel?: string;
          titulo?: string;
          vereda_id?: string;
          foto_url?: string | null;
          razon_cierre?: string | null;
          resultado?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "emergencias_creado_por_fkey";
            columns: ["creado_por"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "emergencias_vereda_id_fkey";
            columns: ["vereda_id"];
            isOneToOne: false;
            referencedRelation: "veredas";
            referencedColumns: ["id"];
          },
        ];
      };
      perfiles: {
        Row: {
          created_at: string;
          id: string;
          nombre: string | null;
          rol: string;
          vereda_id: string | null;
        };
        Insert: {
          created_at?: string;
          id: string;
          nombre?: string | null;
          rol?: string;
          vereda_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          nombre?: string | null;
          rol?: string;
          vereda_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "perfiles_vereda_id_fkey";
            columns: ["vereda_id"];
            isOneToOne: false;
            referencedRelation: "veredas";
            referencedColumns: ["id"];
          },
        ];
      };
      reportes: {
        Row: {
          capturado_en: string | null;
          categoria: string;
          created_at: string;
          descripcion: string | null;
          estado: string;
          foto_url: string | null;
          habitante_id: string | null;
          id: string;
          latitud: number | null;
          lugar: string | null;
          longitud: number | null;
          nivel: string | null;
          nombre_reportante: string | null;
          precision_metros: number | null;
          publicacion_id: string | null;
          publicacion_tabla: string | null;
          revisado_en: string | null;
          revisado_por: string | null;
          titulo: string;
          vereda_id: string;
        };
        Insert: {
          capturado_en?: string | null;
          categoria: string;
          created_at?: string;
          descripcion?: string | null;
          estado?: string;
          foto_url?: string | null;
          habitante_id?: string | null;
          id?: string;
          latitud?: number | null;
          lugar?: string | null;
          longitud?: number | null;
          nivel?: string | null;
          nombre_reportante?: string | null;
          precision_metros?: number | null;
          publicacion_id?: string | null;
          publicacion_tabla?: string | null;
          revisado_en?: string | null;
          revisado_por?: string | null;
          titulo: string;
          vereda_id: string;
        };
        Update: {
          capturado_en?: string | null;
          categoria?: string;
          created_at?: string;
          descripcion?: string | null;
          estado?: string;
          foto_url?: string | null;
          habitante_id?: string | null;
          id?: string;
          latitud?: number | null;
          lugar?: string | null;
          longitud?: number | null;
          nivel?: string | null;
          nombre_reportante?: string | null;
          precision_metros?: number | null;
          publicacion_id?: string | null;
          publicacion_tabla?: string | null;
          revisado_en?: string | null;
          revisado_por?: string | null;
          titulo?: string;
          vereda_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reportes_habitante_id_fkey";
            columns: ["habitante_id"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reportes_revisado_por_fkey";
            columns: ["revisado_por"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reportes_vereda_id_fkey";
            columns: ["vereda_id"];
            isOneToOne: false;
            referencedRelation: "veredas";
            referencedColumns: ["id"];
          },
        ];
      };
      servicios: {
        Row: {
          cerrado_en: string | null;
          foto_url: string | null;
          razon_cierre: string | null;
          resultado: string | null;
          creado_por: string | null;
          created_at: string;
          descripcion: string | null;
          estado: string;
          id: string;
          lugar: string | null;
          nivel: string;
          tipo: string | null;
          titulo: string;
          vereda_id: string;
        };
        Insert: {
          creado_por?: string | null;
          created_at?: string;
          descripcion?: string | null;
          estado?: string;
          id?: string;
          lugar?: string | null;
          nivel: string;
          tipo?: string | null;
          titulo: string;
          vereda_id: string;
          foto_url: string | null;
          razon_cierre: string | null;
          resultado: string | null;
        };
        Update: {
          creado_por?: string | null;
          created_at?: string;
          descripcion?: string | null;
          estado?: string;
          id?: string;
          lugar?: string | null;
          nivel?: string;
          tipo?: string | null;
          titulo?: string;
          vereda_id?: string;
          foto_url?: string | null;
          razon_cierre?: string | null;
          resultado?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "servicios_creado_por_fkey";
            columns: ["creado_por"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "servicios_vereda_id_fkey";
            columns: ["vereda_id"];
            isOneToOne: false;
            referencedRelation: "veredas";
            referencedColumns: ["id"];
          },
        ];
      };
      veredas: {
        Row: {
          created_at: string;
          id: string;
          nombre: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          nombre: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          nombre?: string;
        };
        Relationships: [];
      };
      vias: {
        Row: {
          cerrado_en: string | null;
          foto_url: string | null;
          razon_cierre: string | null;
          resultado: string | null;
          creado_por: string | null;
          created_at: string;
          descripcion: string | null;
          estado: string;
          id: string;
          lugar: string | null;
          nivel: string;
          titulo: string;
          vereda_id: string;
        };
        Insert: {
          creado_por?: string | null;
          created_at?: string;
          descripcion?: string | null;
          estado?: string;
          id?: string;
          lugar?: string | null;
          nivel: string;
          titulo: string;
          vereda_id: string;
          foto_url: string | null;
          razon_cierre: string | null;
          resultado: string | null;
        };
        Update: {
          creado_por?: string | null;
          created_at?: string;
          descripcion?: string | null;
          estado?: string;
          id?: string;
          lugar?: string | null;
          nivel?: string;
          titulo?: string;
          vereda_id?: string;
          foto_url?: string | null;
          razon_cierre?: string | null;
          resultado?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "vias_creado_por_fkey";
            columns: ["creado_por"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vias_vereda_id_fkey";
            columns: ["vereda_id"];
            isOneToOne: false;
            referencedRelation: "veredas";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      es_admin_de: { Args: { vereda: string }; Returns: boolean };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
