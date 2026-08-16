-- ENUMS
CREATE TYPE public.app_role AS ENUM ('habitante', 'admin');
CREATE TYPE public.severidad AS ENUM ('normal', 'precaucion', 'urgente');
CREATE TYPE public.estado_publicacion AS ENUM ('publicado', 'archivado');
CREATE TYPE public.estado_via AS ENUM ('habilitada', 'precaucion', 'afectada', 'cerrada');
CREATE TYPE public.tipo_servicio AS ENUM ('agua', 'luz', 'senal');
CREATE TYPE public.estado_servicio AS ENUM ('normal', 'intermitente', 'suspendido', 'restablecido');
CREATE TYPE public.tipo_reporte AS ENUM ('emergencia', 'via', 'servicio', 'aviso');
CREATE TYPE public.estado_reporte AS ENUM ('pendiente', 'aprobado', 'rechazado');

-- VEREDAS
CREATE TABLE public.veredas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  municipio TEXT NOT NULL DEFAULT 'Ebéjico',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.veredas TO anon;
GRANT SELECT ON public.veredas TO authenticated;
GRANT ALL ON public.veredas TO service_role;
ALTER TABLE public.veredas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "veredas_public_read" ON public.veredas FOR SELECT USING (true);

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL DEFAULT '',
  telefono TEXT,
  vereda_id UUID REFERENCES public.veredas(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own_select" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_own_update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_own_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'habitante',
  vereda_id UUID REFERENCES public.veredas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, vereda_id)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_own_select" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin_de(_user_id UUID, _vereda_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
      AND (vereda_id IS NULL OR vereda_id = _vereda_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- NUEVO USUARIO -> perfil + rol habitante
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, telefono)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'nombre', ''), NEW.raw_user_meta_data ->> 'telefono')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'habitante')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- EMERGENCIAS
CREATE TABLE public.emergencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vereda_id UUID NOT NULL REFERENCES public.veredas(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  severidad public.severidad NOT NULL DEFAULT 'urgente',
  ubicacion TEXT,
  activa BOOLEAN NOT NULL DEFAULT true,
  estado public.estado_publicacion NOT NULL DEFAULT 'publicado',
  autor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.emergencias TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergencias TO authenticated;
GRANT ALL ON public.emergencias TO service_role;
ALTER TABLE public.emergencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "emergencias_public_read" ON public.emergencias FOR SELECT USING (estado = 'publicado');
CREATE POLICY "emergencias_admin_all" ON public.emergencias FOR ALL TO authenticated
  USING (public.is_admin_de(auth.uid(), vereda_id)) WITH CHECK (public.is_admin_de(auth.uid(), vereda_id));
CREATE TRIGGER emergencias_updated_at BEFORE UPDATE ON public.emergencias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- VIAS
CREATE TABLE public.vias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vereda_id UUID NOT NULL REFERENCES public.veredas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  estado_via public.estado_via NOT NULL DEFAULT 'habilitada',
  detalle TEXT NOT NULL DEFAULT '',
  estado public.estado_publicacion NOT NULL DEFAULT 'publicado',
  autor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.vias TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vias TO authenticated;
GRANT ALL ON public.vias TO service_role;
ALTER TABLE public.vias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vias_public_read" ON public.vias FOR SELECT USING (estado = 'publicado');
CREATE POLICY "vias_admin_all" ON public.vias FOR ALL TO authenticated
  USING (public.is_admin_de(auth.uid(), vereda_id)) WITH CHECK (public.is_admin_de(auth.uid(), vereda_id));
CREATE TRIGGER vias_updated_at BEFORE UPDATE ON public.vias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SERVICIOS
CREATE TABLE public.servicios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vereda_id UUID NOT NULL REFERENCES public.veredas(id) ON DELETE CASCADE,
  tipo public.tipo_servicio NOT NULL,
  estado_servicio public.estado_servicio NOT NULL DEFAULT 'normal',
  descripcion TEXT NOT NULL DEFAULT '',
  inicio_estimado TIMESTAMPTZ,
  fin_estimado TIMESTAMPTZ,
  estado public.estado_publicacion NOT NULL DEFAULT 'publicado',
  autor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.servicios TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.servicios TO authenticated;
GRANT ALL ON public.servicios TO service_role;
ALTER TABLE public.servicios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "servicios_public_read" ON public.servicios FOR SELECT USING (estado = 'publicado');
CREATE POLICY "servicios_admin_all" ON public.servicios FOR ALL TO authenticated
  USING (public.is_admin_de(auth.uid(), vereda_id)) WITH CHECK (public.is_admin_de(auth.uid(), vereda_id));
CREATE TRIGGER servicios_updated_at BEFORE UPDATE ON public.servicios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- AVISOS
CREATE TABLE public.avisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vereda_id UUID NOT NULL REFERENCES public.veredas(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  cuerpo TEXT NOT NULL DEFAULT '',
  fecha_evento TIMESTAMPTZ,
  lugar TEXT,
  estado public.estado_publicacion NOT NULL DEFAULT 'publicado',
  autor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.avisos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.avisos TO authenticated;
GRANT ALL ON public.avisos TO service_role;
ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "avisos_public_read" ON public.avisos FOR SELECT USING (estado = 'publicado');
CREATE POLICY "avisos_admin_all" ON public.avisos FOR ALL TO authenticated
  USING (public.is_admin_de(auth.uid(), vereda_id)) WITH CHECK (public.is_admin_de(auth.uid(), vereda_id));
CREATE TRIGGER avisos_updated_at BEFORE UPDATE ON public.avisos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- REPORTES
CREATE TABLE public.reportes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vereda_id UUID NOT NULL REFERENCES public.veredas(id) ON DELETE CASCADE,
  autor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo public.tipo_reporte NOT NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  ubicacion TEXT,
  severidad public.severidad NOT NULL DEFAULT 'precaucion',
  foto_url TEXT,
  estado public.estado_reporte NOT NULL DEFAULT 'pendiente',
  revisado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  revisado_at TIMESTAMPTZ,
  nota_revision TEXT,
  publicacion_tabla TEXT,
  publicacion_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.reportes TO authenticated;
GRANT ALL ON public.reportes TO service_role;
ALTER TABLE public.reportes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reportes_own_select" ON public.reportes FOR SELECT TO authenticated USING (autor_id = auth.uid());
CREATE POLICY "reportes_own_insert" ON public.reportes FOR INSERT TO authenticated WITH CHECK (autor_id = auth.uid() AND estado = 'pendiente');
CREATE POLICY "reportes_admin_select" ON public.reportes FOR SELECT TO authenticated USING (public.is_admin_de(auth.uid(), vereda_id));
CREATE POLICY "reportes_admin_update" ON public.reportes FOR UPDATE TO authenticated
  USING (public.is_admin_de(auth.uid(), vereda_id)) WITH CHECK (public.is_admin_de(auth.uid(), vereda_id));
CREATE TRIGGER reportes_updated_at BEFORE UPDATE ON public.reportes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- DATOS DE ARRANQUE
INSERT INTO public.veredas (nombre) VALUES
  ('La Clara'), ('El Brasil'), ('Sevilla'), ('Guayabal'), ('El Zarzal');

INSERT INTO public.emergencias (vereda_id, titulo, descripcion, severidad, ubicacion)
SELECT id, 'Deslizamiento en la curva del alto', 'Se registró un deslizamiento de tierra tras las lluvias de anoche. Evite transitar a pie por el sector.', 'urgente', 'Alto de La Clara' FROM public.veredas WHERE nombre = 'La Clara';

INSERT INTO public.vias (vereda_id, nombre, estado_via, detalle)
SELECT id, 'Vía principal La Clara - Ebéjico', 'afectada', 'Paso a un solo carril por derrumbe parcial. Solo vehículos altos.' FROM public.veredas WHERE nombre = 'La Clara';
INSERT INTO public.vias (vereda_id, nombre, estado_via, detalle)
SELECT id, 'Camino a El Brasil', 'habilitada', 'Paso normal en ambos sentidos.' FROM public.veredas WHERE nombre = 'El Brasil';

INSERT INTO public.servicios (vereda_id, tipo, estado_servicio, descripcion)
SELECT id, 'agua', 'suspendido', 'Suspensión del acueducto veredal por mantenimiento de la bocatoma.' FROM public.veredas WHERE nombre = 'La Clara';

INSERT INTO public.avisos (vereda_id, titulo, cuerpo, lugar, fecha_evento)
SELECT id, 'Reunión mensual de la JAC', 'Se convoca a todos los habitantes a la reunión ordinaria de la Junta de Acción Comunal.', 'Caseta comunal', now() + interval '7 days' FROM public.veredas WHERE nombre = 'La Clara';