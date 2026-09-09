-- Revisión temporal: no exponer RPC administrativos ni funciones de trigger a anon.
-- Las funciones auxiliares invocadas desde RLS conservan solo los grants
-- intencionales definidos en la migración principal.
revoke execute on function public.validar_admin_asignacion() from public, anon, authenticated;
revoke execute on function public.crear_perfil_nuevo_usuario() from public, anon, authenticated;
revoke execute on function public.preparar_reporte_nuevo() from public, anon, authenticated;

revoke execute on function public.aprobar_solicitud_admin(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.aprobar_solicitud_admin(uuid, uuid, text) to authenticated;

revoke execute on function public.rechazar_solicitud_admin(uuid, text) from public, anon, authenticated;
grant execute on function public.rechazar_solicitud_admin(uuid, text) to authenticated;

revoke execute on function public.aprobar_reporte(uuid, text, uuid, text, text, timestamptz, text) from public, anon, authenticated;
grant execute on function public.aprobar_reporte(uuid, text, uuid, text, text, timestamptz, text) to authenticated;

revoke execute on function public.rechazar_reporte(uuid, text) from public, anon, authenticated;
grant execute on function public.rechazar_reporte(uuid, text) to authenticated;

revoke execute on function public.cerrar_publicacion(text, uuid, text, text) from public, anon, authenticated;
grant execute on function public.cerrar_publicacion(text, uuid, text, text) to authenticated;

revoke execute on function public.retirar_publicacion(text, uuid, text, boolean) from public, anon, authenticated;
grant execute on function public.retirar_publicacion(text, uuid, text, boolean) to authenticated;

revoke execute on function public.revocar_asignacion_admin(uuid, text) from public, anon, authenticated;
grant execute on function public.revocar_asignacion_admin(uuid, text) to authenticated;

revoke execute on function public.registrar_cambio_correo_superadmin(text, text) from public, anon, authenticated;
grant execute on function public.registrar_cambio_correo_superadmin(text, text) to authenticated;
