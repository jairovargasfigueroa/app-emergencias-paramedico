import { mutationOptions, queryOptions, type QueryClient } from '@tanstack/react-query'

import { servicioKeys } from '@/features/servicio/queries'

import {
  atencionApi,
  type Atencion,
  type DatosPaciente,
  type Entrega,
  type EstadoAtencion,
  type MotivoCancelacion,
  type Ubicacion,
} from './api'

export const atencionKeys = {
  activa: (paramedicoId: number) => ['atencion', 'activa', paramedicoId] as const,
  centrosSalud: ['centros-salud'] as const,
}

const ESTADOS_ACTIVOS: EstadoAtencion[] = ['EN_CAMINO', 'EN_EL_LUGAR', 'PACIENTE_RECOGIDO']

/** Atención activa de la ambulancia del paramédico, o `null` si no tiene. */
export const atencionActivaQuery = (paramedicoId: number) =>
  queryOptions({
    queryKey: atencionKeys.activa(paramedicoId),
    queryFn: async ({ signal }) => (await atencionApi.activa(signal)) ?? null,
  })

/** Catálogo de centros de salud. Puede estar vacío: la entrega nunca se bloquea por eso (PB-05 R4). */
export const centrosSaludQuery = () =>
  queryOptions({
    queryKey: atencionKeys.centrosSalud,
    queryFn: ({ signal }) => atencionApi.centrosSalud(signal),
    staleTime: 5 * 60_000,
  })

/**
 * Tras cada transición: si la atención sigue activa se guarda tal cual; si se entregó o canceló, la ambulancia cambió
 * de estado y se vuelve a consultar el servicio.
 */
export function aplicarAtencion(queryClient: QueryClient, paramedicoId: number, atencion: Atencion) {
  const activa = ESTADOS_ACTIVOS.includes(atencion.estado)
  queryClient.setQueryData(atencionKeys.activa(paramedicoId), activa ? atencion : null)
  if (!activa) {
    void queryClient.invalidateQueries({ queryKey: servicioKeys.actual(paramedicoId) })
  }
}

type SobreAtencion = {
  paramedicoId: number
  atencionId: number
}

/** PB-05 CA-01: llegada, con la hora y la ubicación del momento. */
export const marcarLlegadaMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: ({ paramedicoId, atencionId, ubicacion }: SobreAtencion & { ubicacion: Ubicacion }) =>
      atencionApi.marcarLlegada(atencionId, ubicacion),
    onSuccess: (atencion, { paramedicoId }) => aplicarAtencion(queryClient, paramedicoId, atencion),
  })

/** PB-05 CA-02 y CA-07: recogida, con los datos del paciente si se conocen. */
export const marcarRecogidaMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: ({ paramedicoId, atencionId, datos }: SobreAtencion & { datos: Ubicacion & DatosPaciente }) =>
      atencionApi.marcarRecogida(atencionId, datos),
    onSuccess: (atencion, { paramedicoId }) => aplicarAtencion(queryClient, paramedicoId, atencion),
  })

/** PB-05 CA-03, CA-09 y CA-10: entrega con la ubicación actual y, si hay, el centro o la descripción del destino. */
export const entregarMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: ({ paramedicoId, atencionId, datos }: SobreAtencion & { datos: Entrega }) =>
      atencionApi.entregar(atencionId, datos),
    onSuccess: (atencion, { paramedicoId }) => aplicarAtencion(queryClient, paramedicoId, atencion),
  })

/** PB-05 R5: cancelación con motivo obligatorio. Con avería, la ambulancia queda fuera de servicio. */
export const cancelarAtencionMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: ({ paramedicoId, atencionId, motivo }: SobreAtencion & { motivo: MotivoCancelacion }) =>
      atencionApi.cancelar(atencionId, motivo),
    onSuccess: (atencion, { paramedicoId }) => aplicarAtencion(queryClient, paramedicoId, atencion),
  })

/** PB-05 CA-08: los datos del paciente se editan mientras la atención está activa. */
export const actualizarPacienteMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: ({ paramedicoId, atencionId, datos }: SobreAtencion & { datos: DatosPaciente }) =>
      atencionApi.actualizarPaciente(atencionId, datos),
    onSuccess: (atencion, { paramedicoId }) => aplicarAtencion(queryClient, paramedicoId, atencion),
  })
