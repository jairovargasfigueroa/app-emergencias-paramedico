import { useSyncExternalStore } from 'react'

import {
  incidenteDeLaAtencion,
  type Atencion,
  type EstadoAtencion,
  type MotivoCancelacion,
  type Ubicacion,
} from './api'

/** Por qué la unidad se quedó sin el traslado, cuando lo dice el push. */
export type MotivoDelRetiro = Extract<MotivoCancelacion, 'CANCELADA_POR_SOLICITANTE' | 'REASIGNADA'>

export type TrasladoRetirado = {
  trasladoId: number
  pasajero: string | null
  /** `null` cuando la app solo notó que el traslado ya no estaba, sin un push que dijera por qué. */
  motivo: MotivoDelRetiro | null
}

/** Una emergencia no tiene push que avise: solo la nota la app al refrescar, y se la nombra por el lugar. */
export type EmergenciaRetirada = {
  atencionId: number
  /** Dónde era, para buscar su dirección. */
  incidente: (Ubicacion & { id: number }) | null
}

/** Lo que la unidad estaba haciendo y ya no tiene: un traslado, que el push nombra por su id, o una emergencia. */
export type AtencionRetirada = ({ tipo: 'traslado' } & TrasladoRetirado) | ({ tipo: 'emergencia' } & EmergenciaRetirada)

/**
 * Solo se avisa de lo que la unidad estaba haciendo. Lo ya resuelto terminó como tenía que terminar, aunque después
 * libere la unidad otro: un compañero de turno o la central.
 */
const EN_CURSO: EstadoAtencion[] = ['EN_CAMINO', 'EN_EL_LUGAR', 'PACIENTE_RECOGIDO', 'EN_HOSPITAL']

/** Una atención que la unidad todavía está haciendo, traslado o emergencia: de esas se avisa si desaparecen. */
export function esAtencionEnCurso(atencion: Atencion) {
  return EN_CURSO.includes(atencion.estado)
}

let actual: AtencionRetirada | null = null
const oyentes = new Set<() => void>()
/** Retiros ya avisados con su motivo: si después el refresco nota que el traslado no está, no hay nada que agregar. */
const avisadosConMotivo = new Set<number>()

/**
 * La atención en curso que la unidad ya no tiene y que el paramédico todavía no leyó. Un traslado lo avisa el push o
 * lo nota la app al refrescar; una emergencia, solo el refresco. Lo muestra un único aviso, esté donde esté.
 */
export function useAtencionRetirada() {
  return useSyncExternalStore(suscribir, () => actual)
}

export function avisarTrasladoRetirado(retiro: TrasladoRetirado) {
  if (avisadosConMotivo.has(retiro.trasladoId)) {
    return
  }
  const mismo = actual?.tipo === 'traslado' && actual.trasladoId === retiro.trasladoId ? actual : null
  // Sin motivo no hay nada que sumarle al aviso que ya está a la vista.
  if (mismo && retiro.motivo === null) {
    return
  }
  if (retiro.motivo !== null) {
    avisadosConMotivo.add(retiro.trasladoId)
  }
  // El push no trae el pasajero: si el aviso que ya estaba lo tenía, se conserva.
  publicar({ tipo: 'traslado', ...retiro, pasajero: retiro.pasajero ?? mismo?.pasajero ?? null })
}

export function descartarAtencionRetirada() {
  publicar(null)
}

/** Si el aviso a la vista es el de ese traslado: un push que llega después todavía puede decir por qué fue. */
export function seEstaAvisandoElRetiro(trasladoId: number) {
  return actual?.tipo === 'traslado' && actual.trasladoId === trasladoId
}

/**
 * Compara la atención que la app mostraba con la que acaba de devolver el servidor. Si la que la unidad estaba
 * haciendo ya no está, la cerró alguien más: un traslado, quien lo pidió o la central; una emergencia, la central; y
 * cualquiera de las dos, un compañero de turno desde su teléfono. Lo que cierra la tripulación desde la app no pasa
 * por acá: la respuesta de su acción se guarda directo, sin volver a consultar.
 */
export function avisarSiSeRetiroLaAtencion(antes: Atencion | null | undefined, despues: Atencion | null) {
  // A mano, la central puede volver a darle a la unidad un traslado que ya le sacó: si se lo vuelve a sacar, se avisa.
  if (despues?.traslado) {
    avisadosConMotivo.delete(despues.traslado.id)
  }
  if (!antes || !esAtencionEnCurso(antes) || despues?.id === antes.id) {
    return
  }
  if (antes.traslado) {
    avisarTrasladoRetirado({ trasladoId: antes.traslado.id, pasajero: antes.traslado.pasajero, motivo: null })
    return
  }
  // Sin push que la repita, se avisa una sola vez: desde este refresco la app ya no la muestra.
  publicar({ tipo: 'emergencia', atencionId: antes.id, incidente: incidenteDeLaAtencion(antes) ?? null })
}

function publicar(siguiente: AtencionRetirada | null) {
  actual = siguiente
  oyentes.forEach((oyente) => oyente())
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}
