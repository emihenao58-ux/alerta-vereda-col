
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION private.is_admin_de(_user_id uuid, _vereda_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
      AND (vereda_id IS NULL OR vereda_id = _vereda_id)
  );
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_admin_de(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_admin_de(uuid, uuid) TO authenticated, service_role;

DROP POLICY emergencias_admin_all ON public.emergencias;
CREATE POLICY emergencias_admin_all ON public.emergencias FOR ALL TO authenticated
  USING (private.is_admin_de(auth.uid(), vereda_id)) WITH CHECK (private.is_admin_de(auth.uid(), vereda_id));

DROP POLICY vias_admin_all ON public.vias;
CREATE POLICY vias_admin_all ON public.vias FOR ALL TO authenticated
  USING (private.is_admin_de(auth.uid(), vereda_id)) WITH CHECK (private.is_admin_de(auth.uid(), vereda_id));

DROP POLICY servicios_admin_all ON public.servicios;
CREATE POLICY servicios_admin_all ON public.servicios FOR ALL TO authenticated
  USING (private.is_admin_de(auth.uid(), vereda_id)) WITH CHECK (private.is_admin_de(auth.uid(), vereda_id));

DROP POLICY avisos_admin_all ON public.avisos;
CREATE POLICY avisos_admin_all ON public.avisos FOR ALL TO authenticated
  USING (private.is_admin_de(auth.uid(), vereda_id)) WITH CHECK (private.is_admin_de(auth.uid(), vereda_id));

DROP POLICY reportes_admin_update ON public.reportes;
CREATE POLICY reportes_admin_update ON public.reportes FOR UPDATE TO authenticated
  USING (private.is_admin_de(auth.uid(), vereda_id)) WITH CHECK (private.is_admin_de(auth.uid(), vereda_id));

DROP POLICY reportes_admin_select ON public.reportes;
CREATE POLICY reportes_admin_select ON public.reportes FOR SELECT TO authenticated
  USING (private.is_admin_de(auth.uid(), vereda_id));

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.is_admin_de(uuid, uuid);
