import { mutationOptions, queryOptions, type QueryClient } from '@tanstack/react-query'

import { direccionAproximada } from '@/features/incidentes/direcciones'
import { servicioKeys } from '@/features/servicio/queries'

import {
  atencionApi,
  type Atencion,
  type DatosPaciente,
  type Entrega,
  type MotivoCancelacionPropio,
  type MotivoSinTraslado,
  type Movilidad,
  type Ubicacion,
} from './api'
import { avisarSiSeRetiroElTraslado } from './trasladoRetirado'

export const atencionKeys = {
  activa: (paramedicoId: number) => ['atencion', 'activa', paramedicoId] as const,
  misTraslados: ['atencion', 'mis-traslados'] as const,
  centrosSalud: ['centros-salud'] as const,
  direccion: ({ latitud, longitud }: Ubicacion) => ['direccion-punto', latitud, longitud] as const,
}

/**
 * La atención tiene tomada a la unidad hasta que se libera, no hasta que entrega: entre dejar al paciente y quedar
 * libre pasan la entrega al médico y la limpieza.
 */
function ocupaLaUnidad(atencion: Atencion) {
  return atencion.estado !== 'CANCELADA' && atencion.horaLiberacion === null
}

/**
 * Atención activa de la ambulancia del paramédico, o `null` si no tiene. Cada consulta se compara con lo que la app
 * mostraba: si el traslado en curso ya no está, se lo sacaron a la unidad y hay que decírselo.
 */
export const atencionActivaQuery = (paramedicoId: number) =>
  queryOptions({
    queryKey: atencionKeys.activa(paramedicoId),
    queryFn: async ({ client, queryKey, signal }) => {
      const activa = (await atencionApi.activa(signal)) ?? null
      // Contra lo que había al volver la respuesta, no al pedirla: si en el medio la tripulación cerró el traslado
      // desde la app, eso ya está guardado y no hay nada que avisar.
      avisarSiSeRetiroElTraslado(client.getQueryData<Atencion | null>(queryKey), activa)
      return activa
    },
  })

/** Los traslados que hizo este paramédico: su historial. */
export const misTrasladosQuery = () =>
  queryOptions({
    queryKey: atencionKeys.misTraslados,
    queryFn: ({ signal }) => atencionApi.misTraslados(signal),
  })

/**
 * Dirección aproximada de un punto del traslado, resuelta en el teléfono igual que la de un incidente. Se cachea para
 * siempre por punto: el origen y el destino no se mueven y la consulta no tiene por qué repetirse.
 */
export const direccionDelPuntoQuery = (punto: Ubicacion) =>
  queryOptions({
    queryKey: atencionKeys.direccion(punto),
    queryFn: () => direccionAproximada(punto.latitud, punto.longitud),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
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

/** El pasajero de un traslado, si la app lo tiene a mano: el push que avisa que se lo sacaron no lo trae aparte. */
export function pasajeroDelTraslado(queryClient: QueryClient, paramedicoId: number, trasladoId: number) {
  const activa = queryClient.getQueryData(atencionActivaQuery(paramedicoId).queryKey)
  if (activa?.traslado?.id === trasladoId) {
    return activa.traslado.pasajero
  }
  const hechos = queryClient.getQueryData(misTrasladosQuery().queryKey)
  return hechos?.find((atencion) => atencion.traslado?.id === trasladoId)?.traslado?.pasajero ?? null
}

/**
 * Tras un 409 la atención pudo haber cambiado en otro lado, así que se vuelve a pedir. Devuelve si era un traslado
 * que dejó de ser de la unidad: eso tiene su propio aviso, que dice qué pasó mejor que el error de la acción.
 */
export async function reconsultarTrasConflicto(queryClient: QueryClient, paramedicoId: number, atencion: Atencion) {
  await queryClient.invalidateQueries({ queryKey: atencionKeys.activa(paramedicoId) })
  const vigente = queryClient.getQueryData(atencionActivaQuery(paramedicoId).queryKey)
  return atencion.traslado !== null && vigente !== undefined && vigente?.id !== atencion.id
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
    mutationFn: ({ paramedicoId, atencionId, motivo }: SobreAtencion & { motivo: MotivoCancelacionPropio }) =>
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
