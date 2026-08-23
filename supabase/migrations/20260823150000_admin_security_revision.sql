-- ============================================================================
-- ALERTAVEREDA — PAQUETE TÉCNICO FINAL PARA REVISIÓN
-- ============================================================================
-- Estado: MATERIAL DE REVISIÓN. NO EJECUTAR.
--
-- Este archivo contiene DDL, RLS, funciones y triggers propuestos para una
-- futura migración en una rama de revisión. No ha sido aplicado a Supabase,
-- producción, autenticación, roles, datos, Vercel ni la rama principal.
--
-- Adaptación al esquema existente:
--   * public.perfiles.id sigue siendo el mismo UUID de auth.users.id.
--   * public.perfiles.vereda_id se conserva temporalmente como columna legacy;
--     la autorización nueva usa exclusivamente admin_asignaciones.
--   * public.reportes usa habitante_id, revisado_por, publicacion_tabla e
--     publicacion_id; no se inventa visible_publicamente.
--   * Los módulos de publicación siguen siendo emergencias, vias, servicios y
--     avisos.
--
-- Antes de aplicar en una rama, este paquete debe ser probado contra el dump o
-- esquema exacto de esa rama y revisado por la arquitectura del proyecto.
-- ============================================================================

begin;

-- --------------------------------------------------------------------------
-- 0. Precondiciones de seguridad y compatibilidad
-- --------------------------------------------------------------------------

-- El diseño conserva el vínculo actual 1:1 entre perfiles y Auth. No se
-- modifica la política de borrado de auth.users en este paquete.

-- Debe existir exactamente un superadmin antes de crear asignaciones históricas
-- de cualquier administrador legacy. La comprobación se ejecuta como guardia;
-- no crea ni modifica ninguna cuenta superadmin.
do $$
declare
  v_superadmins integer;
begin
  select count(*) into v_superadmins
  from public.perfiles
  where rol = 'superadmin';

  if v_superadmins <> 1 then
    raise exception
      'Precondición incumplida: se esperaba exactamente un superadmin actual; encontrados %',
      v_superadmins;
  end if;
end;
$$;

-- Si hubiera administradores legacy sin vereda, se detiene la transición en vez
-- de asignarles un alcance ambiguo.
do $$
begin
  if exists (
    select 1
    from public.perfiles
    where rol = 'administrador'
      and vereda_id is null
  ) then
    raise exception
      'Hay perfiles legacy con rol administrador y vereda_id nulo; revisión manual requerida';
  end if;
end;
$$;

-- --------------------------------------------------------------------------
-- 1. DDL de perfiles y veredas existentes
-- --------------------------------------------------------------------------

-- El rol se mantiene en public.perfiles, separado de Auth. Se conservan
-- habitante y superadmin por compatibilidad con registros existentes; las
-- nuevas cuentas creadas por el trigger quedan en pendiente.
alter table public.perfiles
  add column if not exists estado_solicitud text;

alter table public.perfiles
  add column if not exists estado_cuenta text;

alter table public.perfiles
  add column if not exists solicitud_decidida_en timestamptz;

alter table public.perfiles
  add column if not exists solicitud_decidida_por uuid;

alter table public.perfiles
  add column if not exists solicitud_razon text;

alter table public.perfiles
  add column if not exists vereda_solicitada_id uuid;

alter table public.perfiles
  add column if not exists updated_at timestamptz;

update public.perfiles
set estado_solicitud = case
      when rol = 'superadmin' then 'aprobada'
      when rol = 'administrador' then 'aprobada'
      when rol = 'habitante' then 'aprobada'
      else coalesce(estado_solicitud, 'pendiente')
    end
where estado_solicitud is null;

update public.perfiles
set estado_cuenta = 'activa'
where estado_cuenta is null;

update public.perfiles
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

-- Elimina el check legacy antes de normalizar administrador -> admin_vereda.
alter table public.perfiles
  drop constraint if exists perfiles_rol_check;

-- Conserva el superadmin actual y normaliza cualquier perfil legacy local.
update public.perfiles
set rol = 'admin_vereda'
where rol = 'administrador';

alter table public.perfiles
  alter column rol set default 'pendiente',
  alter column estado_solicitud set default 'pendiente',
  alter column estado_solicitud set not null,
  alter column estado_cuenta set default 'activa',
  alter column estado_cuenta set not null,
  alter column updated_at set default now(),
  alter column updated_at set not null;

alter table public.perfiles
  add constraint perfiles_rol_check
  check (rol in ('habitante', 'pendiente', 'admin_vereda', 'superadmin'));

alter table public.perfiles
  add constraint perfiles_estado_solicitud_check
  check (estado_solicitud in ('pendiente', 'aprobada', 'rechazada'));

alter table public.perfiles
  add constraint perfiles_estado_cuenta_check
  check (estado_cuenta in ('activa', 'suspendida', 'desactivada'));

alter table public.perfiles
  add constraint perfiles_decision_consistente_check
  check (
    (estado_solicitud = 'pendiente'
      and solicitud_decidida_en is null
      and solicitud_decidida_por is null)
    or
    estado_solicitud in ('aprobada', 'rechazada')
  );

alter table public.perfiles
  add constraint perfiles_solicitud_decidida_por_fkey
  foreign key (solicitud_decidida_por)
  references public.perfiles (id)
  on delete restrict;

-- La columna vereda_id existente se conserva temporalmente para no romper
-- consumidores actuales. No se usa para autorizar; admin_asignaciones es la
-- fuente canónica del alcance territorial.

alter table public.veredas
  add column if not exists activa boolean;

alter table public.veredas
  add column if not exists updated_at timestamptz;

update public.veredas
set activa = coalesce(activa, true),
    updated_at = coalesce(updated_at, created_at, now());

alter table public.veredas
  alter column activa set default true,
  alter column activa set not null,
  alter column updated_at set default now(),
  alter column updated_at set not null;

alter table public.perfiles
  add constraint perfiles_vereda_solicitada_id_fkey
  foreign key (vereda_solicitada_id)
  references public.veredas (id)
  on delete restrict;

-- --------------------------------------------------------------------------
-- 2. Tabla de asignaciones territoriales
-- --------------------------------------------------------------------------

create table if not exists public.admin_asignaciones (
  id bigint generated always as identity primary key,
  perfil_id uuid not null
    references public.perfiles (id) on delete restrict,
  vereda_id uuid not null
    references public.veredas (id) on delete restrict,
  estado text not null default 'activa'
    check (estado in ('activa', 'revocada')),
  vigente_desde timestamptz not null default now(),
  vigente_hasta timestamptz,
  asignado_por uuid not null
    references public.perfiles (id) on delete restrict,
  motivo text,
  created_at timestamptz not null default now(),
  check (
    (estado = 'activa' and vigente_hasta is null)
    or
    (estado = 'revocada'
      and vigente_hasta is not null
      and vigente_hasta >= vigente_desde)
  )
);

create unique index if not exists admin_asignaciones_unica_activa_idx
  on public.admin_asignaciones (perfil_id)
  where estado = 'activa';

create index if not exists admin_asignaciones_vereda_activa_idx
  on public.admin_asignaciones (vereda_id, perfil_id)
  where estado = 'activa';

create index if not exists admin_asignaciones_perfil_historial_idx
  on public.admin_asignaciones (perfil_id, vigente_desde desc);

create or replace function public.validar_admin_asignacion()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_target public.perfiles%rowtype;
  v_actor public.perfiles%rowtype;
begin
  select * into v_target
  from public.perfiles
  where id = new.perfil_id;

  if not found
     or v_target.rol <> 'admin_vereda'
     or v_target.estado_cuenta <> 'activa' then
    raise exception 'La asignación requiere un admin_vereda con cuenta activa';
  end if;

  select * into v_actor
  from public.perfiles
  where id = new.asignado_por;

  if not found
     or v_actor.rol <> 'superadmin'
     or v_actor.estado_cuenta <> 'activa' then
    raise exception 'La asignación solo puede ser creada por un superadmin activo';
  end if;

  return new;
end;
$$;

drop trigger if exists validar_admin_asignacion on public.admin_asignaciones;
create trigger validar_admin_asignacion
before insert or update on public.admin_asignaciones
for each row execute function public.validar_admin_asignacion();

-- Migración de alcance de perfiles legacy, si existieran. Usa el único
-- superadmin ya existente como actor histórico; no crea un superadmin.
insert into public.admin_asignaciones
  (perfil_id, vereda_id, estado, vigente_desde, asignado_por, motivo)
select
  p.id,
  p.vereda_id,
  'activa',
  coalesce(p.created_at, now()),
  sa.id,
  'Migración de asignación legacy desde perfiles.vereda_id'
from public.perfiles p
cross join lateral (
  select id
  from public.perfiles
  where rol = 'superadmin'
  limit 1
) sa
where p.rol = 'admin_vereda'
  and p.vereda_id is not null
  and not exists (
    select 1
    from public.admin_asignaciones aa
    where aa.perfil_id = p.id
      and aa.estado = 'activa'
  );

-- --------------------------------------------------------------------------
-- 3. Tabla de auditoría append-only
-- --------------------------------------------------------------------------

create table if not exists public.auditoria_admin (
  id bigint generated always as identity primary key,
  ocurrido_en timestamptz not null default now(),
  actor_auth_user_id uuid,
  actor_perfil_id uuid,
  actor_rol text not null,
  actor_vereda_id uuid,
  entidad_tipo text not null
    check (entidad_tipo in ('reporte', 'publicacion', 'perfil', 'asignacion', 'vereda')),
  entidad_id text not null,
  reporte_id uuid,
  publicacion_tabla text,
  publicacion_id uuid,
  recurso_vereda_id uuid,
  accion text not null
    check (accion in (
      'solicitud_aprobada',
      'solicitud_rechazada',
      'reporte_aprobado_creado',
      'reporte_aprobado_actualizado',
      'reporte_rechazado',
      'reporte_cerrado',
      'reporte_retirado',
      'asignacion_creada',
      'asignacion_revocada',
      'vereda_actualizada',
      'correo_superadmin_cambiado'
    )),
  estado_anterior text,
  estado_nuevo text,
  motivo text,
  metadata jsonb not null default '{}'::jsonb,
  request_id uuid
);

create index if not exists auditoria_admin_reporte_idx
  on public.auditoria_admin (reporte_id, ocurrido_en desc);

create index if not exists auditoria_admin_publicacion_idx
  on public.auditoria_admin (publicacion_tabla, publicacion_id, ocurrido_en desc);

create index if not exists auditoria_admin_vereda_idx
  on public.auditoria_admin (recurso_vereda_id, ocurrido_en desc);

create index if not exists auditoria_admin_actor_idx
  on public.auditoria_admin (actor_perfil_id, ocurrido_en desc);

-- --------------------------------------------------------------------------
-- 4. Ajuste compatible de categorías de reportes
-- --------------------------------------------------------------------------

-- La producción usa actualmente emergencia, via, servicio y otro. Se conserva
-- otro como la categoría vigente de avisos; aprobar_reporte lo trata como la
-- tabla avisos sin migrar ni renombrar los datos existentes.
alter table public.reportes
  drop constraint if exists reportes_categoria_valida;

alter table public.reportes
  add constraint reportes_categoria_valida
  check (categoria in ('emergencia', 'via', 'servicio', 'aviso', 'otro'));

-- --------------------------------------------------------------------------
-- 5. Funciones auxiliares de identidad y alcance
-- --------------------------------------------------------------------------

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select p.id
  from public.perfiles p
  where p.id = auth.uid()
  limit 1;
$$;

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select p.rol
  from public.perfiles p
  where p.id = auth.uid()
  limit 1;
$$;

create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.perfiles p
    where p.id = auth.uid()
      and p.rol = 'superadmin'
      and p.estado_cuenta = 'activa'
  );
$$;

create or replace function public.is_active_admin_vereda()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.perfiles p
    join public.admin_asignaciones aa on aa.perfil_id = p.id
    where p.id = auth.uid()
      and p.rol = 'admin_vereda'
      and p.estado_cuenta = 'activa'
      and aa.estado = 'activa'
      and aa.vigente_hasta is null
  );
$$;

create or replace function public.current_admin_vereda_id()
returns uuid
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select aa.vereda_id
  from public.perfiles p
  join public.admin_asignaciones aa on aa.perfil_id = p.id
  where p.id = auth.uid()
    and p.rol = 'admin_vereda'
    and p.estado_cuenta = 'activa'
    and aa.estado = 'activa'
    and aa.vigente_hasta is null
  limit 1;
$$;

create or replace function public.has_active_vereda_access(p_vereda_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select public.is_superadmin()
    or exists (
      select 1
      from public.perfiles p
      join public.admin_asignaciones aa on aa.perfil_id = p.id
      where p.id = auth.uid()
        and p.rol = 'admin_vereda'
        and p.estado_cuenta = 'activa'
        and aa.estado = 'activa'
        and aa.vigente_hasta is null
        and aa.vereda_id = p_vereda_id
    );
$$;

-- Compatibilidad temporal para consumidores legacy. Las políticas nuevas no
-- dependen de esta función; el alcance se deriva de admin_asignaciones.
create or replace function public.es_admin_de(vereda uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select public.has_active_vereda_access(vereda);
$$;

create or replace function public.assert_can_manage_vereda(p_vereda_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
begin
  if not public.has_active_vereda_access(p_vereda_id) then
    raise exception 'El actor no tiene alcance administrativo sobre esta vereda';
  end if;
end;
$$;

-- --------------------------------------------------------------------------
-- 6. Escritura interna de auditoría
-- --------------------------------------------------------------------------

create or replace function public.registrar_auditoria_admin(
  p_entidad_tipo text,
  p_entidad_id text,
  p_reporte_id uuid,
  p_publicacion_tabla text,
  p_publicacion_id uuid,
  p_recurso_vereda_id uuid,
  p_accion text,
  p_estado_anterior text,
  p_estado_nuevo text,
  p_motivo text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_request_id uuid default null
)
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor_perfil_id uuid;
  v_actor_rol text;
  v_actor_vereda_id uuid;
  v_audit_id bigint;
begin
  select p.id, p.rol, aa.vereda_id
    into v_actor_perfil_id, v_actor_rol, v_actor_vereda_id
  from public.perfiles p
  left join lateral (
    select a.vereda_id
    from public.admin_asignaciones a
    where a.perfil_id = p.id
      and a.estado = 'activa'
      and a.vigente_hasta is null
    order by a.vigente_desde desc
    limit 1
  ) aa on true
  where p.id = auth.uid()
  limit 1;

  if v_actor_perfil_id is null or v_actor_rol is null then
    raise exception 'No existe un perfil autorizado para el actor actual';
  end if;

  insert into public.auditoria_admin (
    actor_auth_user_id,
    actor_perfil_id,
    actor_rol,
    actor_vereda_id,
    entidad_tipo,
    entidad_id,
    reporte_id,
    publicacion_tabla,
    publicacion_id,
    recurso_vereda_id,
    accion,
    estado_anterior,
    estado_nuevo,
    motivo,
    metadata,
    request_id
  ) values (
    auth.uid(),
    v_actor_perfil_id,
    v_actor_rol,
    v_actor_vereda_id,
    p_entidad_tipo,
    p_entidad_id,
    p_reporte_id,
    p_publicacion_tabla,
    p_publicacion_id,
    p_recurso_vereda_id,
    p_accion,
    p_estado_anterior,
    p_estado_nuevo,
    nullif(btrim(p_motivo), ''),
    coalesce(p_metadata, '{}'::jsonb),
    p_request_id
  )
  returning id into v_audit_id;

  return v_audit_id;
end;
$$;

-- --------------------------------------------------------------------------
-- 7. Trigger actualizado de creación de perfiles
-- --------------------------------------------------------------------------

create or replace function public.crear_perfil_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  insert into public.perfiles (
    id,
    rol,
    estado_solicitud,
    estado_cuenta,
    nombre,
    vereda_solicitada_id,
    created_at,
    updated_at
  ) values (
    new.id,
    'pendiente',
    'pendiente',
    'activa',
    nullif(new.raw_user_meta_data ->> 'nombre', ''),
    nullif(new.raw_user_meta_data ->> 'vereda_solicitada_id', '')::uuid,
    now(),
    now()
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.crear_perfil_nuevo_usuario();

-- --------------------------------------------------------------------------
-- 8. Trigger de updated_at para perfiles y veredas
-- --------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists perfiles_touch_updated_at on public.perfiles;
create trigger perfiles_touch_updated_at
before update on public.perfiles
for each row execute function public.touch_updated_at();

drop trigger if exists veredas_touch_updated_at on public.veredas;
create trigger veredas_touch_updated_at
before update on public.veredas
for each row execute function public.touch_updated_at();

-- --------------------------------------------------------------------------
-- 9. Aprobación y rechazo de solicitudes administrativas
-- --------------------------------------------------------------------------

create or replace function public.aprobar_solicitud_admin(
  p_perfil_id uuid,
  p_vereda_id uuid,
  p_motivo text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_target public.perfiles%rowtype;
  v_vereda public.veredas%rowtype;
  v_assignment_id bigint;
  v_audit_id bigint;
begin
  if not public.is_superadmin() then
    raise exception 'Solo un superadmin puede aprobar solicitudes administrativas';
  end if;

  select * into v_target
  from public.perfiles
  where id = p_perfil_id
  for update;

  if not found then
    raise exception 'El perfil solicitado no existe';
  end if;

  if v_target.rol <> 'pendiente'
     or v_target.estado_solicitud <> 'pendiente'
     or v_target.estado_cuenta <> 'activa' then
    raise exception 'La solicitud no está pendiente o la cuenta no está activa';
  end if;

  select * into v_vereda
  from public.veredas
  where id = p_vereda_id
    and activa = true
  for share;

  if not found then
    raise exception 'La vereda no existe o no está activa';
  end if;

  if exists (
    select 1
    from public.admin_asignaciones
    where perfil_id = p_perfil_id
      and estado = 'activa'
  ) then
    raise exception 'El perfil ya tiene una asignación activa';
  end if;

  update public.perfiles
  set rol = 'admin_vereda',
      estado_solicitud = 'aprobada',
      estado_cuenta = 'activa',
      vereda_id = p_vereda_id, -- compatibilidad temporal; no es fuente de autorización
      solicitud_decidida_en = now(),
      solicitud_decidida_por = public.current_profile_id(),
      solicitud_razon = nullif(btrim(p_motivo), ''),
      updated_at = now()
  where id = p_perfil_id;

  insert into public.admin_asignaciones (
    perfil_id,
    vereda_id,
    estado,
    vigente_desde,
    asignado_por,
    motivo
  ) values (
    p_perfil_id,
    p_vereda_id,
    'activa',
    now(),
    public.current_profile_id(),
    nullif(btrim(p_motivo), '')
  )
  returning id into v_assignment_id;

  v_audit_id := public.registrar_auditoria_admin(
    'perfil',
    p_perfil_id::text,
    null,
    null,
    null,
    p_vereda_id,
    'solicitud_aprobada',
    'pendiente',
    'admin_vereda',
    p_motivo,
    jsonb_build_object('vereda_id', p_vereda_id, 'asignacion_id', v_assignment_id),
    null
  );

  return jsonb_build_object(
    'perfil_id', p_perfil_id,
    'vereda_id', p_vereda_id,
    'asignacion_id', v_assignment_id,
    'audit_id', v_audit_id,
    'rol', 'admin_vereda',
    'estado_solicitud', 'aprobada'
  );
end;
$$;

create or replace function public.rechazar_solicitud_admin(
  p_perfil_id uuid,
  p_motivo text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_target public.perfiles%rowtype;
  v_audit_id bigint;
begin
  if not public.is_superadmin() then
    raise exception 'Solo un superadmin puede rechazar solicitudes administrativas';
  end if;

  if nullif(btrim(p_motivo), '') is null then
    raise exception 'El rechazo de una solicitud requiere un motivo';
  end if;

  select * into v_target
  from public.perfiles
  where id = p_perfil_id
  for update;

  if not found then
    raise exception 'El perfil solicitado no existe';
  end if;

  if v_target.rol <> 'pendiente'
     or v_target.estado_solicitud <> 'pendiente' then
    raise exception 'La solicitud no está pendiente';
  end if;

  update public.perfiles
  set rol = 'pendiente',
      estado_solicitud = 'rechazada',
      solicitud_decidida_en = now(),
      solicitud_decidida_por = public.current_profile_id(),
      solicitud_razon = nullif(btrim(p_motivo), ''),
      updated_at = now()
  where id = p_perfil_id;

  v_audit_id := public.registrar_auditoria_admin(
    'perfil',
    p_perfil_id::text,
    null,
    null,
    null,
    null,
    'solicitud_rechazada',
    'pendiente',
    'pendiente/rechazada',
    p_motivo,
    '{}'::jsonb,
    null
  );

  return jsonb_build_object(
    'perfil_id', p_perfil_id,
    'rol', 'pendiente',
    'estado_solicitud', 'rechazada',
    'audit_id', v_audit_id
  );
end;
$$;

-- --------------------------------------------------------------------------
-- 10. Aprobación de reportes y creación/actualización de publicación
-- --------------------------------------------------------------------------

-- p_modo: crear | actualizar
-- p_estado_inicial: requerido para via y servicio al crear; opcional al actualizar.
-- p_tipo_servicio: requerido para servicio al crear.
-- p_fecha_publicacion: usado por avisos; por defecto now().
-- p_emergencia_estado: Activa o En observación; también se conserva al actualizar.
--
-- La fila reportes se bloquea con FOR UPDATE antes de tocar la publicación.
-- Las publicaciones existentes también se bloquean cuando el modo es actualizar.
create or replace function public.aprobar_reporte(
  p_reporte_id uuid,
  p_modo text default 'crear',
  p_publicacion_id uuid default null,
  p_estado_inicial text default null,
  p_tipo_servicio text default null,
  p_fecha_publicacion timestamptz default null,
  p_emergencia_estado text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_reporte public.reportes%rowtype;
  v_actor_id uuid;
  v_publicacion_id uuid;
  v_publicacion_tabla text;
  v_tipo_servicio text;
  v_fecha_publicacion timestamptz;
  v_audit_id bigint;
begin
  if p_modo not in ('crear', 'actualizar') then
    raise exception 'p_modo debe ser crear o actualizar';
  end if;

  -- Concurrencia: este bloqueo debe ocurrir antes de crear/actualizar la
  -- publicación. Dos revisores no pueden aprobar el mismo reporte.
  select * into v_reporte
  from public.reportes
  where id = p_reporte_id
  for update;

  if not found then
    raise exception 'El reporte no existe';
  end if;

  if v_reporte.estado <> 'pendiente' then
    raise exception 'El reporte ya fue revisado';
  end if;

  perform public.assert_can_manage_vereda(v_reporte.vereda_id);
  v_actor_id := public.current_profile_id();

  if p_modo = 'crear' and p_publicacion_id is not null then
    raise exception 'El modo crear no acepta p_publicacion_id';
  end if;

  if p_modo = 'actualizar' and p_publicacion_id is null then
    raise exception 'El modo actualizar requiere p_publicacion_id';
  end if;

  if v_reporte.categoria = 'emergencia' then
    v_publicacion_tabla := 'emergencias';

    if coalesce(p_emergencia_estado, 'Activa') not in ('Activa', 'En observación') then
      raise exception 'La emergencia requiere estado Activa o En observación';
    end if;

    if p_modo = 'crear' then
      insert into public.emergencias (
        vereda_id, titulo, descripcion, lugar, nivel, estado,
        creado_por, created_at, foto_url
      ) values (
        v_reporte.vereda_id,
        v_reporte.titulo,
        v_reporte.descripcion,
        v_reporte.lugar,
        coalesce(v_reporte.nivel, 'normal'),
        coalesce(p_emergencia_estado, 'Activa'),
        v_actor_id,
        now(),
        v_reporte.foto_url
      )
      returning id into v_publicacion_id;
    else
      perform 1
      from public.emergencias
      where id = p_publicacion_id
        and vereda_id = v_reporte.vereda_id
        and cerrado_en is null
      for update;

      if not found then
        raise exception 'La emergencia destino no existe, no pertenece a la vereda o ya está cerrada';
      end if;

      update public.emergencias
      set titulo = v_reporte.titulo,
          descripcion = v_reporte.descripcion,
          lugar = v_reporte.lugar,
          nivel = coalesce(v_reporte.nivel, nivel),
          estado = coalesce(p_emergencia_estado, estado),
          foto_url = coalesce(v_reporte.foto_url, foto_url)
      where id = p_publicacion_id
        and vereda_id = v_reporte.vereda_id
      returning id into v_publicacion_id;
    end if;

  elsif v_reporte.categoria = 'via' then
    v_publicacion_tabla := 'vias';

    if p_modo = 'crear' then
      if p_estado_inicial not in ('Habilitada', 'Precaución', 'Afectada', 'Cerrada') then
        raise exception 'La vía requiere un estado inicial válido';
      end if;

      insert into public.vias (
        vereda_id, titulo, descripcion, lugar, nivel, estado,
        creado_por, created_at, foto_url
      ) values (
        v_reporte.vereda_id,
        v_reporte.titulo,
        v_reporte.descripcion,
        v_reporte.lugar,
        coalesce(v_reporte.nivel, 'normal'),
        p_estado_inicial,
        v_actor_id,
        now(),
        v_reporte.foto_url
      )
      returning id into v_publicacion_id;
    else
      perform 1
      from public.vias
      where id = p_publicacion_id
        and vereda_id = v_reporte.vereda_id
        and cerrado_en is null
      for update;

      if not found then
        raise exception 'La vía destino no existe, no pertenece a la vereda o ya está cerrada';
      end if;

      if p_estado_inicial is not null
         and p_estado_inicial not in ('Habilitada', 'Precaución', 'Afectada', 'Cerrada') then
        raise exception 'La vía requiere un estado válido';
      end if;

      update public.vias
      set titulo = v_reporte.titulo,
          descripcion = v_reporte.descripcion,
          lugar = v_reporte.lugar,
          nivel = coalesce(v_reporte.nivel, nivel),
          estado = coalesce(p_estado_inicial, estado),
          foto_url = coalesce(v_reporte.foto_url, foto_url)
      where id = p_publicacion_id
        and vereda_id = v_reporte.vereda_id
      returning id into v_publicacion_id;
    end if;

  elsif v_reporte.categoria = 'servicio' then
    v_publicacion_tabla := 'servicios';

    if p_modo = 'crear' then
      if p_tipo_servicio not in ('agua', 'energia', 'senal', 'internet', 'luz', 'otro') then
        raise exception 'El servicio requiere un tipo válido';
      end if;
      if coalesce(p_estado_inicial, 'Normal') not in ('Normal', 'Intermitente', 'Interrumpido') then
        raise exception 'El servicio requiere estado Normal, Intermitente o Interrumpido';
      end if;
      v_tipo_servicio := p_tipo_servicio;

      insert into public.servicios (
        vereda_id, titulo, descripcion, lugar, nivel, estado,
        creado_por, created_at, tipo, foto_url
      ) values (
        v_reporte.vereda_id,
        v_reporte.titulo,
        v_reporte.descripcion,
        v_reporte.lugar,
        coalesce(v_reporte.nivel, 'normal'),
        coalesce(p_estado_inicial, 'Normal'),
        v_actor_id,
        now(),
        v_tipo_servicio,
        v_reporte.foto_url
      )
      returning id into v_publicacion_id;
    else
      perform 1
      from public.servicios
      where id = p_publicacion_id
        and vereda_id = v_reporte.vereda_id
        and cerrado_en is null
      for update;

      if not found then
        raise exception 'El servicio destino no existe, no pertenece a la vereda o ya está cerrado';
      end if;

      if p_tipo_servicio is not null
         and p_tipo_servicio not in ('agua', 'energia', 'senal', 'internet', 'luz', 'otro') then
        raise exception 'El servicio requiere un tipo válido';
      end if;
      if p_estado_inicial is not null
         and p_estado_inicial not in ('Normal', 'Intermitente', 'Interrumpido') then
        raise exception 'El servicio requiere estado Normal, Intermitente o Interrumpido';
      end if;

      update public.servicios
      set titulo = v_reporte.titulo,
          descripcion = v_reporte.descripcion,
          lugar = v_reporte.lugar,
          nivel = coalesce(v_reporte.nivel, nivel),
          estado = coalesce(p_estado_inicial, estado),
          tipo = coalesce(p_tipo_servicio, tipo),
          foto_url = coalesce(v_reporte.foto_url, foto_url)
      where id = p_publicacion_id
        and vereda_id = v_reporte.vereda_id
      returning id into v_publicacion_id;
    end if;

  elsif v_reporte.categoria in ('aviso', 'otro') then
    v_publicacion_tabla := 'avisos';
    v_fecha_publicacion := coalesce(p_fecha_publicacion, now());

    if p_modo = 'crear' then
      insert into public.avisos (
        vereda_id, titulo, descripcion, lugar, fecha,
        creado_por, created_at
      ) values (
        v_reporte.vereda_id,
        v_reporte.titulo,
        v_reporte.descripcion,
        v_reporte.lugar,
        v_fecha_publicacion,
        v_actor_id,
        now()
      )
      returning id into v_publicacion_id;
    else
      perform 1
      from public.avisos
      where id = p_publicacion_id
        and vereda_id = v_reporte.vereda_id
        and cerrado_en is null
      for update;

      if not found then
        raise exception 'El aviso destino no existe, no pertenece a la vereda o ya está cerrado';
      end if;

      update public.avisos
      set titulo = v_reporte.titulo,
          descripcion = v_reporte.descripcion,
          lugar = v_reporte.lugar,
          fecha = coalesce(p_fecha_publicacion, fecha)
      where id = p_publicacion_id
        and vereda_id = v_reporte.vereda_id
      returning id into v_publicacion_id;
    end if;
  else
    raise exception 'Categoría de reporte no soportada: %', v_reporte.categoria;
  end if;

  update public.reportes
  set estado = 'aprobado',
      revisado_por = v_actor_id,
      revisado_en = now(),
      publicacion_tabla = v_publicacion_tabla,
      publicacion_id = v_publicacion_id
  where id = p_reporte_id;

  v_audit_id := public.registrar_auditoria_admin(
    'reporte',
    p_reporte_id::text,
    p_reporte_id,
    v_publicacion_tabla,
    v_publicacion_id,
    v_reporte.vereda_id,
    case when p_modo = 'crear'
      then 'reporte_aprobado_creado'
      else 'reporte_aprobado_actualizado'
    end,
    'pendiente',
    'aprobado',
    null,
    jsonb_build_object(
      'categoria', v_reporte.categoria,
      'modo', p_modo
    ),
    null
  );

  return jsonb_build_object(
    'reporte_id', p_reporte_id,
    'estado', 'aprobado',
    'categoria', v_reporte.categoria,
    'publicacion_tabla', v_publicacion_tabla,
    'publicacion_id', v_publicacion_id,
    'audit_id', v_audit_id
  );
end;
$$;

-- --------------------------------------------------------------------------
-- 11. Rechazo de reportes
-- --------------------------------------------------------------------------

create or replace function public.rechazar_reporte(
  p_reporte_id uuid,
  p_motivo text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_reporte public.reportes%rowtype;
  v_actor_id uuid;
  v_audit_id bigint;
begin
  if nullif(btrim(p_motivo), '') is null then
    raise exception 'El rechazo de un reporte requiere un motivo';
  end if;

  select * into v_reporte
  from public.reportes
  where id = p_reporte_id
  for update;

  if not found then
    raise exception 'El reporte no existe';
  end if;

  if v_reporte.estado <> 'pendiente' then
    raise exception 'El reporte ya fue revisado';
  end if;

  perform public.assert_can_manage_vereda(v_reporte.vereda_id);
  v_actor_id := public.current_profile_id();

  update public.reportes
  set estado = 'rechazado',
      revisado_por = v_actor_id,
      revisado_en = now(),
      publicacion_tabla = null,
      publicacion_id = null
  where id = p_reporte_id;

  v_audit_id := public.registrar_auditoria_admin(
    'reporte',
    p_reporte_id::text,
    p_reporte_id,
    null,
    null,
    v_reporte.vereda_id,
    'reporte_rechazado',
    'pendiente',
    'rechazado',
    p_motivo,
    jsonb_build_object('categoria', v_reporte.categoria),
    null
  );

  return jsonb_build_object(
    'reporte_id', p_reporte_id,
    'estado', 'rechazado',
    'audit_id', v_audit_id
  );
end;
$$;

-- --------------------------------------------------------------------------
-- 12. Cierre no destructivo de publicaciones
-- --------------------------------------------------------------------------

-- p_resultado: solucionado | no_solucionado
-- No se permite cerrar avisos con esta función: un aviso que termina
-- naturalmente se retira con p_finalizacion_natural=true en retirar_reporte.
create or replace function public.cerrar_reporte(
  p_reporte_id uuid,
  p_resultado text,
  p_motivo text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_reporte public.reportes%rowtype;
  v_actor_id uuid;
  v_audit_id bigint;
  v_reason text := nullif(btrim(p_motivo), '');
begin
  if p_resultado not in ('solucionado', 'no_solucionado') then
    raise exception 'El resultado de cierre debe ser solucionado o no_solucionado';
  end if;

  if p_resultado = 'no_solucionado' and v_reason is null then
    raise exception 'no_solucionado requiere razon_cierre';
  end if;

  select * into v_reporte
  from public.reportes
  where id = p_reporte_id
  for update;

  if not found then
    raise exception 'El reporte no existe';
  end if;

  if v_reporte.estado <> 'aprobado'
     or v_reporte.publicacion_tabla is null
     or v_reporte.publicacion_id is null then
    raise exception 'El reporte no tiene una publicación aprobada asociada';
  end if;

  if v_reporte.categoria = 'aviso' then
    raise exception 'Los avisos se finalizan mediante retirar_reporte con finalizacion_natural';
  end if;

  perform public.assert_can_manage_vereda(v_reporte.vereda_id);
  v_actor_id := public.current_profile_id();

  if v_reporte.categoria = 'emergencia'
     and v_reporte.publicacion_tabla = 'emergencias' then
    perform 1
    from public.emergencias
    where id = v_reporte.publicacion_id
      and vereda_id = v_reporte.vereda_id
      and cerrado_en is null
    for update;

    if not found then
      raise exception 'La emergencia asociada no existe, no pertenece a la vereda o ya está cerrada';
    end if;

    update public.emergencias
    set cerrado_en = now(),
        resultado = p_resultado,
        razon_cierre = v_reason,
        estado = case when p_resultado = 'solucionado' then 'Cerrada' else estado end
    where id = v_reporte.publicacion_id
      and vereda_id = v_reporte.vereda_id;

  elsif v_reporte.categoria = 'via'
        and v_reporte.publicacion_tabla = 'vias' then
    perform 1
    from public.vias
    where id = v_reporte.publicacion_id
      and vereda_id = v_reporte.vereda_id
      and cerrado_en is null
    for update;

    if not found then
      raise exception 'La vía asociada no existe, no pertenece a la vereda o ya está cerrada';
    end if;

    update public.vias
    set cerrado_en = now(),
        resultado = p_resultado,
        razon_cierre = v_reason,
        estado = case when p_resultado = 'solucionado' then 'Habilitada' else estado end
    where id = v_reporte.publicacion_id
      and vereda_id = v_reporte.vereda_id;

  elsif v_reporte.categoria = 'servicio'
        and v_reporte.publicacion_tabla = 'servicios' then
    perform 1
    from public.servicios
    where id = v_reporte.publicacion_id
      and vereda_id = v_reporte.vereda_id
      and cerrado_en is null
    for update;

    if not found then
      raise exception 'El servicio asociado no existe, no pertenece a la vereda o ya está cerrado';
    end if;

    update public.servicios
    set cerrado_en = now(),
        resultado = p_resultado,
        razon_cierre = v_reason,
        estado = case when p_resultado = 'solucionado' then 'Normal' else estado end
    where id = v_reporte.publicacion_id
      and vereda_id = v_reporte.vereda_id;
  else
    raise exception 'La categoría y la tabla de publicación no coinciden';
  end if;

  v_audit_id := public.registrar_auditoria_admin(
    'publicacion',
    v_reporte.publicacion_id::text,
    p_reporte_id,
    v_reporte.publicacion_tabla,
    v_reporte.publicacion_id,
    v_reporte.vereda_id,
    'reporte_cerrado',
    null,
    p_resultado,
    v_reason,
    jsonb_build_object('categoria', v_reporte.categoria),
    null
  );

  return jsonb_build_object(
    'reporte_id', p_reporte_id,
    'publicacion_tabla', v_reporte.publicacion_tabla,
    'publicacion_id', v_reporte.publicacion_id,
    'resultado', p_resultado,
    'audit_id', v_audit_id
  );
end;
$$;

-- --------------------------------------------------------------------------
-- 13. Retiro no destructivo, incluido aviso finalizado naturalmente
-- --------------------------------------------------------------------------

-- Para un aviso terminado naturalmente:
--   retirar_reporte(id, null, true)
-- La base conserva resultado='retirado' por la restricción existente; la
-- interfaz debe mostrar 'Finalizado' cuando categoria='aviso' y
-- razon_cierre='finalizacion_natural'.
create or replace function public.retirar_reporte(
  p_reporte_id uuid,
  p_motivo text default null,
  p_finalizacion_natural boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_reporte public.reportes%rowtype;
  v_actor_id uuid;
  v_audit_id bigint;
  v_reason text;
begin
  if p_finalizacion_natural and p_motivo is not null then
    raise exception 'La finalización natural usa el motivo controlado del sistema';
  end if;

  select * into v_reporte
  from public.reportes
  where id = p_reporte_id
  for update;

  if not found then
    raise exception 'El reporte no existe';
  end if;

  if v_reporte.estado <> 'aprobado'
     or v_reporte.publicacion_tabla is null
     or v_reporte.publicacion_id is null then
    raise exception 'El reporte no tiene una publicación aprobada asociada';
  end if;

  if p_finalizacion_natural and v_reporte.categoria <> 'aviso' then
    raise exception 'La finalización natural solo aplica a avisos';
  end if;

  if not p_finalizacion_natural and nullif(btrim(p_motivo), '') is null then
    raise exception 'El retiro requiere un motivo';
  end if;

  v_reason := case
    when p_finalizacion_natural then 'finalizacion_natural'
    else nullif(btrim(p_motivo), '')
  end;

  perform public.assert_can_manage_vereda(v_reporte.vereda_id);
  v_actor_id := public.current_profile_id();

  if v_reporte.categoria = 'emergencia'
     and v_reporte.publicacion_tabla = 'emergencias' then
    perform 1
    from public.emergencias
    where id = v_reporte.publicacion_id
      and vereda_id = v_reporte.vereda_id
      and cerrado_en is null
    for update;

    if not found then
      raise exception 'La emergencia asociada no existe, no pertenece a la vereda o ya está cerrada';
    end if;

    update public.emergencias
    set cerrado_en = now(),
        resultado = 'retirado',
        razon_cierre = v_reason
    where id = v_reporte.publicacion_id
      and vereda_id = v_reporte.vereda_id;

  elsif v_reporte.categoria = 'via'
        and v_reporte.publicacion_tabla = 'vias' then
    perform 1
    from public.vias
    where id = v_reporte.publicacion_id
      and vereda_id = v_reporte.vereda_id
      and cerrado_en is null
    for update;

    if not found then
      raise exception 'La vía asociada no existe, no pertenece a la vereda o ya está cerrada';
    end if;

    update public.vias
    set cerrado_en = now(),
        resultado = 'retirado',
        razon_cierre = v_reason
    where id = v_reporte.publicacion_id
      and vereda_id = v_reporte.vereda_id;

  elsif v_reporte.categoria = 'servicio'
        and v_reporte.publicacion_tabla = 'servicios' then
    perform 1
    from public.servicios
    where id = v_reporte.publicacion_id
      and vereda_id = v_reporte.vereda_id
      and cerrado_en is null
    for update;

    if not found then
      raise exception 'El servicio asociado no existe, no pertenece a la vereda o ya está cerrado';
    end if;

    update public.servicios
    set cerrado_en = now(),
        resultado = 'retirado',
        razon_cierre = v_reason
    where id = v_reporte.publicacion_id
      and vereda_id = v_reporte.vereda_id;

  elsif v_reporte.categoria = 'aviso'
        and v_reporte.publicacion_tabla = 'avisos' then
    perform 1
    from public.avisos
    where id = v_reporte.publicacion_id
      and vereda_id = v_reporte.vereda_id
      and cerrado_en is null
    for update;

    if not found then
      raise exception 'El aviso asociado no existe, no pertenece a la vereda o ya está cerrado';
    end if;

    update public.avisos
    set cerrado_en = now(),
        resultado = 'retirado',
        razon_cierre = v_reason
    where id = v_reporte.publicacion_id
      and vereda_id = v_reporte.vereda_id;
  else
    raise exception 'La categoría y la tabla de publicación no coinciden';
  end if;

  v_audit_id := public.registrar_auditoria_admin(
    'publicacion',
    v_reporte.publicacion_id::text,
    p_reporte_id,
    v_reporte.publicacion_tabla,
    v_reporte.publicacion_id,
    v_reporte.vereda_id,
    'reporte_retirado',
    null,
    'retirado',
    v_reason,
    jsonb_build_object(
      'categoria', v_reporte.categoria,
      'finalizacion_natural', p_finalizacion_natural
    ),
    null
  );

  return jsonb_build_object(
    'reporte_id', p_reporte_id,
    'publicacion_tabla', v_reporte.publicacion_tabla,
    'publicacion_id', v_reporte.publicacion_id,
    'resultado', 'retirado',
    'finalizacion_natural', p_finalizacion_natural,
    'audit_id', v_audit_id
  );
end;
$$;

-- --------------------------------------------------------------------------
-- 14. Preparación server-side de nuevos reportes
-- --------------------------------------------------------------------------

create or replace function public.preparar_reporte_nuevo()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  -- El cliente nunca decide si un reporte ya está aprobado ni puede asociar
  -- una publicación o un revisor al momento de insertar.
  new.estado := 'pendiente';
  new.revisado_por := null;
  new.revisado_en := null;
  new.publicacion_tabla := null;
  new.publicacion_id := null;
  new.created_at := now();

  if auth.uid() is null then
    new.habitante_id := null;
  elsif public.current_app_role() in ('habitante', 'pendiente') then
    if new.habitante_id is null then
      new.habitante_id := auth.uid();
    elsif new.habitante_id <> auth.uid() then
      raise exception 'habitante_id no coincide con el usuario autenticado';
    end if;
  else
    raise exception 'El rol actual no puede crear reportes comunitarios';
  end if;

  return new;
end;
$$;

drop trigger if exists reportes_preparar_nuevo on public.reportes;
create trigger reportes_preparar_nuevo
before insert on public.reportes
for each row execute function public.preparar_reporte_nuevo();

-- --------------------------------------------------------------------------
-- 15. Cierre/retiro por publicación, revocación y cambio de correo confirmado
-- --------------------------------------------------------------------------

create or replace function public.cerrar_publicacion(
  p_tabla text,
  p_id uuid,
  p_resultado text,
  p_motivo text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_vereda_id uuid;
  v_actor_id uuid;
  v_audit_id bigint;
  v_razon text := nullif(btrim(p_motivo), '');
begin
  if p_tabla not in ('emergencias', 'vias', 'servicios', 'avisos') then
    raise exception 'Tabla de publicación no permitida';
  end if;
  if p_resultado not in ('solucionado', 'no_solucionado') then
    raise exception 'El cierre debe ser solucionado o no_solucionado';
  end if;
  if p_resultado = 'no_solucionado' and v_razon is null then
    raise exception 'no_solucionado requiere una razón';
  end if;

  if p_tabla = 'emergencias' then
    select vereda_id into v_vereda_id from public.emergencias where id = p_id and cerrado_en is null for update;
  elsif p_tabla = 'vias' then
    select vereda_id into v_vereda_id from public.vias where id = p_id and cerrado_en is null for update;
  elsif p_tabla = 'servicios' then
    select vereda_id into v_vereda_id from public.servicios where id = p_id and cerrado_en is null for update;
  else
    select vereda_id into v_vereda_id from public.avisos where id = p_id and cerrado_en is null for update;
  end if;

  if v_vereda_id is null then
    raise exception 'La publicación no existe o ya está cerrada';
  end if;
  perform public.assert_can_manage_vereda(v_vereda_id);
  v_actor_id := public.current_profile_id();

  if p_tabla = 'emergencias' then
    update public.emergencias
    set cerrado_en = now(), resultado = p_resultado, razon_cierre = v_razon,
        estado = case when p_resultado = 'solucionado' then 'Cerrada' else estado end
    where id = p_id;
  elsif p_tabla = 'vias' then
    update public.vias
    set cerrado_en = now(), resultado = p_resultado, razon_cierre = v_razon,
        estado = case when p_resultado = 'solucionado' then 'Habilitada' else estado end
    where id = p_id;
  elsif p_tabla = 'servicios' then
    update public.servicios
    set cerrado_en = now(), resultado = p_resultado, razon_cierre = v_razon,
        estado = case when p_resultado = 'solucionado' then 'Normal' else estado end
    where id = p_id;
  else
    update public.avisos
    set cerrado_en = now(), resultado = p_resultado, razon_cierre = v_razon
    where id = p_id;
  end if;

  v_audit_id := public.registrar_auditoria_admin(
    'publicacion', p_id::text, null, p_tabla, p_id, v_vereda_id,
    'reporte_cerrado', null, p_resultado, v_razon, '{}'::jsonb, null
  );

  return jsonb_build_object('publicacion_tabla', p_tabla, 'publicacion_id', p_id, 'resultado', p_resultado, 'audit_id', v_audit_id);
end;
$$;

create or replace function public.retirar_publicacion(
  p_tabla text,
  p_id uuid,
  p_motivo text default null,
  p_finalizacion_natural boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_vereda_id uuid;
  v_audit_id bigint;
  v_razon text;
begin
  if p_tabla not in ('emergencias', 'vias', 'servicios', 'avisos') then
    raise exception 'Tabla de publicación no permitida';
  end if;
  if p_finalizacion_natural and p_tabla <> 'avisos' then
    raise exception 'La finalización natural solo aplica a avisos';
  end if;
  if not p_finalizacion_natural and nullif(btrim(p_motivo), '') is null then
    raise exception 'El retiro requiere una razón';
  end if;
  v_razon := case when p_finalizacion_natural then 'finalizacion_natural' else nullif(btrim(p_motivo), '') end;

  if p_tabla = 'emergencias' then
    select vereda_id into v_vereda_id from public.emergencias where id = p_id and cerrado_en is null for update;
  elsif p_tabla = 'vias' then
    select vereda_id into v_vereda_id from public.vias where id = p_id and cerrado_en is null for update;
  elsif p_tabla = 'servicios' then
    select vereda_id into v_vereda_id from public.servicios where id = p_id and cerrado_en is null for update;
  else
    select vereda_id into v_vereda_id from public.avisos where id = p_id and cerrado_en is null for update;
  end if;

  if v_vereda_id is null then
    raise exception 'La publicación no existe o ya está cerrada';
  end if;
  perform public.assert_can_manage_vereda(v_vereda_id);

  if p_tabla = 'emergencias' then
    update public.emergencias set cerrado_en = now(), resultado = 'retirado', razon_cierre = v_razon where id = p_id;
  elsif p_tabla = 'vias' then
    update public.vias set cerrado_en = now(), resultado = 'retirado', razon_cierre = v_razon where id = p_id;
  elsif p_tabla = 'servicios' then
    update public.servicios set cerrado_en = now(), resultado = 'retirado', razon_cierre = v_razon where id = p_id;
  else
    update public.avisos set cerrado_en = now(), resultado = 'retirado', razon_cierre = v_razon where id = p_id;
  end if;

  v_audit_id := public.registrar_auditoria_admin(
    'publicacion', p_id::text, null, p_tabla, p_id, v_vereda_id,
    'reporte_retirado', null, 'retirado', v_razon,
    jsonb_build_object('finalizacion_natural', p_finalizacion_natural), null
  );

  return jsonb_build_object('publicacion_tabla', p_tabla, 'publicacion_id', p_id, 'resultado', 'retirado', 'finalizacion_natural', p_finalizacion_natural, 'audit_id', v_audit_id);
end;
$$;

create or replace function public.revocar_asignacion_admin(
  p_perfil_id uuid,
  p_motivo text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_target public.perfiles%rowtype;
  v_asignacion public.admin_asignaciones%rowtype;
  v_audit_id bigint;
begin
  if not public.is_superadmin() then
    raise exception 'Solo un superadmin puede revocar asignaciones';
  end if;
  if nullif(btrim(p_motivo), '') is null then
    raise exception 'La revocación requiere un motivo';
  end if;

  select * into v_target from public.perfiles where id = p_perfil_id for update;
  if not found or v_target.rol <> 'admin_vereda' then
    raise exception 'El perfil no es un administrador de vereda';
  end if;

  select * into v_asignacion
  from public.admin_asignaciones
  where perfil_id = p_perfil_id and estado = 'activa' and vigente_hasta is null
  for update;
  if not found then
    raise exception 'El administrador no tiene una asignación activa';
  end if;

  update public.admin_asignaciones
  set estado = 'revocada', vigente_hasta = now(), motivo = nullif(btrim(p_motivo), '')
  where id = v_asignacion.id;

  update public.perfiles
  set estado_cuenta = 'suspendida', updated_at = now()
  where id = p_perfil_id;

  v_audit_id := public.registrar_auditoria_admin(
    'asignacion', v_asignacion.id::text, null, null, null, v_asignacion.vereda_id,
    'asignacion_revocada', 'activa', 'revocada', p_motivo,
    jsonb_build_object('perfil_id', p_perfil_id, 'estado_cuenta_nuevo', 'suspendida'), null
  );

  return jsonb_build_object('perfil_id', p_perfil_id, 'vereda_id', v_asignacion.vereda_id, 'estado_cuenta', 'suspendida', 'audit_id', v_audit_id);
end;
$$;

create or replace function public.registrar_cambio_correo_superadmin(
  p_correo_anterior text,
  p_correo_nuevo text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_correo_confirmado text;
  v_audit_id bigint;
begin
  if not public.is_superadmin() then
    raise exception 'Solo un superadmin puede auditar este cambio';
  end if;
  select email into v_correo_confirmado from auth.users where id = auth.uid();
  if v_correo_confirmado is null or lower(v_correo_confirmado) <> lower(p_correo_nuevo) then
    raise exception 'El cambio de correo todavía no está confirmado en Auth';
  end if;
  if lower(p_correo_anterior) = lower(p_correo_nuevo) then
    raise exception 'El correo nuevo debe ser diferente';
  end if;

  v_audit_id := public.registrar_auditoria_admin(
    'perfil', public.current_profile_id()::text, null, null, null, null,
    'correo_superadmin_cambiado', p_correo_anterior, p_correo_nuevo, null,
    jsonb_build_object('confirmado_en_auth', true), null
  );

  return jsonb_build_object('audit_id', v_audit_id, 'correo_nuevo', v_correo_nuevo);
end;
$$;

-- --------------------------------------------------------------------------
-- 16. Protección append-only de auditoría
-- --------------------------------------------------------------------------

create or replace function public.bloquear_mutacion_auditoria_admin()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  raise exception 'auditoria_admin es append-only: no se permite UPDATE, DELETE ni TRUNCATE';
end;
$$;

drop trigger if exists auditoria_admin_no_update_delete on public.auditoria_admin;
create trigger auditoria_admin_no_update_delete
before update or delete on public.auditoria_admin
for each row execute function public.bloquear_mutacion_auditoria_admin();

drop trigger if exists auditoria_admin_no_truncate on public.auditoria_admin;
create trigger auditoria_admin_no_truncate
before truncate on public.auditoria_admin
for each statement execute function public.bloquear_mutacion_auditoria_admin();

-- --------------------------------------------------------------------------
-- 16. Limpieza de políticas actuales y RLS finales
-- --------------------------------------------------------------------------

-- Perfiles: elimina la política actual que permitía INSERT desde el cliente.
drop policy if exists "Un usuario crea su propio perfil al registrarse"
  on public.perfiles;
drop policy if exists "Un usuario ve su propio perfil"
  on public.perfiles;

-- Veredas.
drop policy if exists "Cualquiera puede ver las veredas"
  on public.veredas;

-- Reportes.
drop policy if exists "Cualquiera puede reportar, siempre pendiente"
  on public.reportes;
drop policy if exists "El admin de la vereda ve los reportes de su vereda"
  on public.reportes;
drop policy if exists "Solo el admin de la vereda actualiza el reporte"
  on public.reportes;

-- Publicaciones: se eliminan políticas legacy de lectura y escritura, en
-- especial todos los DELETE de admin de vereda.
drop policy if exists "Admin de la vereda borra emergencias"
  on public.emergencias;
drop policy if exists "Admin de la vereda edita emergencias"
  on public.emergencias;
drop policy if exists "Admin de la vereda publica emergencias"
  on public.emergencias;
drop policy if exists "Lectura pública de emergencias"
  on public.emergencias;
drop policy if exists emergencias_public_read
  on public.emergencias;

drop policy if exists "Admin de la vereda borra vías"
  on public.vias;
drop policy if exists "Admin de la vereda edita vías"
  on public.vias;
drop policy if exists "Admin de la vereda publica vías"
  on public.vias;
drop policy if exists "Lectura pública de vías"
  on public.vias;
drop policy if exists vias_public_read
  on public.vias;

drop policy if exists "Admin de la vereda borra servicios"
  on public.servicios;
drop policy if exists "Admin de la vereda edita servicios"
  on public.servicios;
drop policy if exists "Admin de la vereda publica servicios"
  on public.servicios;
drop policy if exists "Lectura pública de servicios"
  on public.servicios;
drop policy if exists servicios_public_read
  on public.servicios;

drop policy if exists "Admin de la vereda borra avisos"
  on public.avisos;
drop policy if exists "Admin de la vereda edita avisos"
  on public.avisos;
drop policy if exists "Admin de la vereda publica avisos"
  on public.avisos;
drop policy if exists "Lectura pública de avisos"
  on public.avisos;
drop policy if exists avisos_public_read
  on public.avisos;

alter table public.perfiles enable row level security;
alter table public.veredas enable row level security;
alter table public.admin_asignaciones enable row level security;
alter table public.auditoria_admin enable row level security;
alter table public.reportes enable row level security;
alter table public.emergencias enable row level security;
alter table public.vias enable row level security;
alter table public.servicios enable row level security;
alter table public.avisos enable row level security;

-- El cliente no recibe permisos directos de escritura administrativa. Las
-- funciones SECURITY DEFINER son la única vía para las transiciones.
revoke insert, update, delete on public.perfiles from public, anon, authenticated;
revoke insert, update, delete on public.veredas from public, anon, authenticated;
revoke insert, update, delete on public.admin_asignaciones from public, anon, authenticated;
revoke all on public.auditoria_admin from public;
revoke all on public.auditoria_admin from anon, authenticated;
revoke insert, update, delete, truncate on public.auditoria_admin from service_role;
revoke insert, update, delete on public.reportes from public, anon, authenticated;
revoke select, update, delete on public.reportes from public, anon;
revoke insert, update, delete on public.emergencias from public, anon, authenticated;
revoke insert, update, delete on public.vias from public, anon, authenticated;
revoke insert, update, delete on public.servicios from public, anon, authenticated;
revoke insert, update, delete on public.avisos from public, anon, authenticated;

-- Se retira también el DELETE explícito legacy de los módulos para que un
-- admin_vereda no pueda borrar publicaciones por REST/PostgREST.
revoke delete on public.emergencias from anon, authenticated;
revoke delete on public.vias from anon, authenticated;
revoke delete on public.servicios from anon, authenticated;
revoke delete on public.avisos from anon, authenticated;

-- Lectura pública de catálogo y publicaciones activas.
grant select on public.veredas to anon, authenticated;
grant select on public.emergencias, public.vias, public.servicios, public.avisos
  to anon, authenticated;

-- Inserción pública de reportes; no se concede SELECT público sobre la cola.
grant insert on public.reportes to anon, authenticated;
grant select on public.reportes to authenticated;

-- Lectura interna de perfiles/asignaciones; RLS limita las filas.
grant select on public.perfiles, public.admin_asignaciones to authenticated;
grant select on public.auditoria_admin to authenticated;

-- Perfiles: cada usuario ve su fila; el superadmin ve la cola completa.
create policy perfiles_select_propio_o_superadmin
on public.perfiles
for select
to authenticated
using (
  id = auth.uid()
  or public.is_superadmin()
);

-- Veredas: público solo ve activas; superadmin puede consultar también las
-- inactivas para gestión futura.
create policy veredas_select_publico_activas
on public.veredas
for select
to anon, authenticated
using (
  activa = true
  or public.is_superadmin()
);

-- Asignaciones: el superadmin ve todo; el admin local solo ve su propio
-- historial de asignaciones.
create policy asignaciones_select_superadmin_o_propio
on public.admin_asignaciones
for select
to authenticated
using (
  public.is_superadmin()
  or perfil_id = public.current_profile_id()
);

-- Auditoría: exclusivamente superadmin desde el panel de supervisión.
create policy auditoria_select_superadmin
on public.auditoria_admin
for select
to authenticated
using (public.is_superadmin());

-- Reportes: no hay SELECT anónimo. Admin local ve su vereda; superadmin ve
-- todas. No hay UPDATE/DELETE directo: las funciones bloquean la fila y
-- realizan las transiciones autorizadas.
create policy reportes_select_por_alcance
on public.reportes
for select
to authenticated
using (
  public.is_superadmin()
  or public.has_active_vereda_access(vereda_id)
);

create policy reportes_insert_pendiente
on public.reportes
for insert
to anon, authenticated
with check (
  estado = 'pendiente'
  and revisado_por is null
  and revisado_en is null
  and publicacion_tabla is null
  and publicacion_id is null
  and exists (
    select 1
    from public.veredas v
    where v.id = vereda_id
      and v.activa = true
  )
  and (
    (
      auth.role() = 'anon'
      and habitante_id is null
    )
    or
    (
      auth.role() = 'authenticated'
      and public.current_app_role() in ('habitante', 'pendiente')
      and (habitante_id is null or habitante_id = auth.uid())
    )
  )
);

-- Publicaciones: público solo ve filas todavía activas; admin local ve el
-- archivo completo de su vereda; superadmin ve todas. Las acciones de
-- escritura pasan por aprobar_reporte/cerrar_publicacion/retirar_publicacion.
create policy emergencias_select_por_contexto
on public.emergencias
for select
to anon, authenticated
using (
  cerrado_en is null
  or public.is_superadmin()
  or public.has_active_vereda_access(vereda_id)
);

create policy vias_select_por_contexto
on public.vias
for select
to anon, authenticated
using (
  cerrado_en is null
  or public.is_superadmin()
  or public.has_active_vereda_access(vereda_id)
);

create policy servicios_select_por_contexto
on public.servicios
for select
to anon, authenticated
using (
  cerrado_en is null
  or public.is_superadmin()
  or public.has_active_vereda_access(vereda_id)
);

create policy avisos_select_por_contexto
on public.avisos
for select
to anon, authenticated
using (
  cerrado_en is null
  or public.is_superadmin()
  or public.has_active_vereda_access(vereda_id)
);

-- --------------------------------------------------------------------------
-- 17. Privilegios de funciones
-- --------------------------------------------------------------------------

-- Las funciones auxiliares se pueden usar desde las políticas; no se concede
-- escritura ni acceso a registrar_auditoria_admin.
revoke execute on function public.current_profile_id() from public, anon, authenticated;
revoke execute on function public.current_app_role() from public, anon, authenticated;
revoke execute on function public.is_superadmin() from public, anon, authenticated;
revoke execute on function public.is_active_admin_vereda() from public, anon, authenticated;
revoke execute on function public.current_admin_vereda_id() from public, anon, authenticated;
revoke execute on function public.has_active_vereda_access(uuid) from public, anon, authenticated;
revoke execute on function public.es_admin_de(uuid) from public, anon, authenticated;

grant execute on function public.current_profile_id() to anon, authenticated;
grant execute on function public.current_app_role() to anon, authenticated;
grant execute on function public.is_superadmin() to anon, authenticated;
grant execute on function public.is_active_admin_vereda() to authenticated;
grant execute on function public.current_admin_vereda_id() to authenticated;
grant execute on function public.has_active_vereda_access(uuid) to anon, authenticated;
grant execute on function public.es_admin_de(uuid) to authenticated;

revoke execute on function public.assert_can_manage_vereda(uuid)
  from public, anon, authenticated;
revoke execute on function public.registrar_auditoria_admin(text, text, uuid, text, uuid, uuid, text, text, text, text, jsonb, uuid)
  from public, anon, authenticated, service_role;

revoke execute on function public.aprobar_solicitud_admin(uuid, uuid, text)
  from public;
grant execute on function public.aprobar_solicitud_admin(uuid, uuid, text)
  to authenticated;

revoke execute on function public.rechazar_solicitud_admin(uuid, text)
  from public;
grant execute on function public.rechazar_solicitud_admin(uuid, text)
  to authenticated;

revoke execute on function public.aprobar_reporte(uuid, text, uuid, text, text, timestamptz, text)
  from public, anon, authenticated;
grant execute on function public.aprobar_reporte(uuid, text, uuid, text, text, timestamptz, text)
  to authenticated;

revoke execute on function public.rechazar_reporte(uuid, text)
  from public;
grant execute on function public.rechazar_reporte(uuid, text)
  to authenticated;

revoke execute on function public.cerrar_reporte(uuid, text, text)
  from public, anon, authenticated;
revoke execute on function public.retirar_reporte(uuid, text, boolean)
  from public, anon, authenticated;

revoke execute on function public.cerrar_publicacion(text, uuid, text, text)
  from public;
grant execute on function public.cerrar_publicacion(text, uuid, text, text)
  to authenticated;

revoke execute on function public.retirar_publicacion(text, uuid, text, boolean)
  from public;
grant execute on function public.retirar_publicacion(text, uuid, text, boolean)
  to authenticated;

revoke execute on function public.revocar_asignacion_admin(uuid, text)
  from public;
grant execute on function public.revocar_asignacion_admin(uuid, text)
  to authenticated;

revoke execute on function public.registrar_cambio_correo_superadmin(text, text)
  from public;
grant execute on function public.registrar_cambio_correo_superadmin(text, text)
  to authenticated;

-- La secuencia de auditoría y la de asignaciones no se exponen al cliente.
revoke all on sequence public.auditoria_admin_id_seq from anon, authenticated, service_role;
revoke all on sequence public.admin_asignaciones_id_seq from anon, authenticated, service_role;

commit;

-- ============================================================================
-- FIN DEL PAQUETE. NO APLICADO.
-- ============================================================================
