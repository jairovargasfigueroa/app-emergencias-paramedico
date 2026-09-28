import { useSyncExternalStore } from 'react'

import type { Atencion, EstadoAtencion, MotivoCancelacion } from './api'

/** Por qué la unidad se quedó sin el traslado, cuando lo dice el push. */
export type MotivoDelRetiro = Extract<MotivoCancelacion, 'CANCELADA_POR_SOLICITANTE' | 'REASIGNADA'>

export type TrasladoRetirado = {
  trasladoId: number
  pasajero: string | null
  /** `null` cuando la app solo notó que el traslado ya no estaba, sin un push que dijera por qué. */
  motivo: MotivoDelRetiro | null
}

/** Solo se le saca el traslado a la unidad mientras lo está haciendo: lo ya resuelto no se reasigna. */
const EN_CURSO: EstadoAtencion[] = ['EN_CAMINO', 'EN_EL_LUGAR', 'PACIENTE_RECOGIDO', 'EN_HOSPITAL']

let actual: TrasladoRetirado | null = null
const oyentes = new Set<() => void>()
/** Retiros ya avisados con su motivo: si después el refresco nota que el traslado no está, no hay nada que agregar. */
const avisadosConMotivo = new Set<number>()

/**
 * El traslado que le sacaron a la unidad y que el paramédico todavía no leyó. Lo avisa el push o lo nota la app al
 * refrescar la atención, y lo muestra un único aviso, esté donde esté.
 */
export function useTrasladoRetirado() {
  return useSyncExternalStore(suscribir, () => actual)
}

export function avisarTrasladoRetirado(retiro: TrasladoRetirado) {
  if (avisadosConMotivo.has(retiro.trasladoId)) {
    return
  }
  const mismo = actual?.trasladoId === retiro.trasladoId ? actual : null
  // Sin motivo no hay nada que sumarle al aviso que ya está a la vista.
  if (mismo && retiro.motivo === null) {
    return
  }
  if (retiro.motivo !== null) {
    avisadosConMotivo.add(retiro.trasladoId)
  }
  // El push no trae el pasajero: si el aviso que ya estaba lo tenía, se conserva.
  publicar({ ...retiro, pasajero: retiro.pasajero ?? mismo?.pasajero ?? null })
}

export function descartarTrasladoRetirado() {
  publicar(null)
}

/** Si el aviso a la vista es el de ese traslado: un push que llega después todavía puede decir por qué fue. */
export function seEstaAvisandoElRetiro(trasladoId: number) {
  return actual?.trasladoId === trasladoId
}

/**
 * Compara la atención que la app mostraba con la que acaba de devolver el servidor. Si el traslado que la unidad
 * estaba haciendo ya no está, lo cerró alguien más: quien lo pidió o la central. Lo que cierra la tripulación desde
 * la app no pasa por acá: la respuesta de su acción se guarda directo, sin volver a consultar.
 */
export function avisarSiSeRetiroElTraslado(antes: Atencion | null | undefined, despues: Atencion | null) {
  if (!antes?.traslado || !EN_CURSO.includes(antes.estado) || despues?.id === antes.id) {
    return
  }
  avisarTrasladoRetirado({ trasladoId: antes.traslado.id, pasajero: antes.traslado.pasajero, motivo: null })
}

function publicar(siguiente: TrasladoRetirado | null) {
  actual = siguiente
  oyentes.forEach((oyente) => oyente())
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}
