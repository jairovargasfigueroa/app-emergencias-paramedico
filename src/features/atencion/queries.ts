import { mutationOptions, queryOptions, type QueryClient } from '@tanstack/react-query'

import { servicioKeys } from '@/features/servicio/queries'

import {
  atencionApi,
  type Atencion,
  type DatosPaciente,
  type Entrega,
  type MotivoCancelacion,
  type MotivoSinTraslado,
  type Movilidad,
  type Ubicacion,
} from './api'

export const atencionKeys = {
  activa: (paramedicoId: number) => ['atencion', 'activa', paramedicoId] as const,
  centrosSalud: ['centros-salud'] as const,
}

/**
 * La atención tiene tomada a la unidad hasta que se libera, no hasta que entrega: entre dejar al paciente y quedar
 * libre pasan la entrega al médico y la limpieza.
 */
function ocupaLaUnidad(atencion: Atencion) {
  return atencion.estado !== 'CANCELADA' && atencion.horaLiberacion === null
}

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
 * Tras cada transición: mientras la atención siga ocupando a la unidad se guarda tal cual; al liberarse o cancelarse,
 * la ambulancia cambió de estado y se vuelve a consultar el servicio.
 */
export function aplicarAtencion(queryClient: QueryClient, paramedicoId: number, atencion: Atencion) {
  const ocupada = ocupaLaUnidad(atencion)
  queryClient.setQueryData(atencionKeys.activa(paramedicoId), ocupada ? atencion : null)
  if (!ocupada) {
    void queryClient.invalidateQueries({ queryKey: servicioKeys.actual(paramedicoId) })
  }
}

type SobreAtencion = {
  paramedicoId: number
  atencionId: number
}

/** Llegada al centro de salud con el paciente a bordo. La unidad sigue ocupada. */
export const marcarLlegadaAlHospitalMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: ({ atencionId, ubicacion }: SobreAtencion & { ubicacion: Ubicacion }) =>
      atencionApi.marcarLlegadaAlHospital(atencionId, ubicacion),
    onSuccess: (atencion, { paramedicoId }) => aplicarAtencion(queryClient, paramedicoId, atencion),
  })

/** La unidad fue y no trasladó a nadie. El motivo decide con qué estado cierra el incidente. */
export const cerrarSinTrasladoMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: ({ atencionId, datos }: SobreAtencion & { datos: Ubicacion & { motivo: MotivoSinTraslado } }) =>
      atencionApi.cerrarSinTraslado(atencionId, datos),
    onSuccess: (atencion, { paramedicoId }) => aplicarAtencion(queryClient, paramedicoId, atencion),
  })

/** La unidad termina de entregar, limpia y queda libre. Recién acá puede recibir otra emergencia. */
export const liberarMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: ({ atencionId }: SobreAtencion) => atencionApi.liberar(atencionId),
    onSuccess: (atencion, { paramedicoId }) => aplicarAtencion(queryClient, paramedicoId, atencion),
  })

/** Solo en traslados: llegó y el paciente no estaba listo. Deja la marca; seguir esperando o irse se decide después. */
export const marcarPacienteNoListoMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: ({ atencionId }: SobreAtencion) => atencionApi.marcarPacienteNoListo(atencionId),
    onSuccess: (atencion, { paramedicoId }) => aplicarAtencion(queryClient, paramedicoId, atencion),
  })

/** Solo en traslados: el paciente necesita más de lo que esta unidad puede dar, y el pedido vuelve a la cola. */
export const unidadNoCorrespondeMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: ({
      atencionId,
      ...datos
    }: SobreAtencion & Ubicacion & { movilidad: Movilidad; oxigeno: boolean; equipo: boolean }) =>
      atencionApi.unidadNoCorresponde(atencionId, datos),
    onSuccess: (atencion, { paramedicoId }) => aplicarAtencion(queryClient, paramedicoId, atencion),
  })

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
