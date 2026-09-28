import type { TonoInsignia } from '@/shared/ui/Insignia'

import type { EstadoAtencion, MotivoCancelacion, MotivoSinTraslado, Movilidad, TipoUnidad } from './api'

/** Se leen en el historial de traslados: por eso se habla de origen y destino. */
export const TEXTO_ESTADO: Record<EstadoAtencion, string> = {
  EN_CAMINO: 'En camino',
  EN_EL_LUGAR: 'En el origen',
  PACIENTE_RECOGIDO: 'Paciente a bordo',
  EN_HOSPITAL: 'En el destino',
  PACIENTE_ENTREGADO: 'Entregado',
  SIN_TRASLADO: 'Sin traslado',
  CANCELADA: 'Cancelada',
}

export const TONO_ESTADO: Record<EstadoAtencion, TonoInsignia> = {
  EN_CAMINO: 'ambar',
  EN_EL_LUGAR: 'ambar',
  PACIENTE_RECOGIDO: 'ambar',
  EN_HOSPITAL: 'ambar',
  PACIENTE_ENTREGADO: 'verde',
  SIN_TRASLADO: 'gris',
  CANCELADA: 'gris',
}

export const TEXTO_MOVILIDAD: Record<Movilidad, string> = {
  CAMINA_CON_AYUDA: 'Camina con ayuda',
  SILLA_DE_RUEDAS: 'Silla de ruedas',
  CAMILLA: 'Camilla',
}

/** En corto, como las nombra el panel del administrador: la tripulación sabe qué es cada tipo. */
export const TEXTO_TIPO_UNIDAD: Record<TipoUnidad, string> = {
  IA: 'Tipo IA',
  IB: 'Tipo IB',
  II: 'Tipo II',
  III: 'Tipo III',
}

/**
 * Cómo se cuenta un desenlace ya ocurrido. No son los mismos textos que los diálogos: ahí son opciones que el
 * paramédico elige en primera persona ("Lo atendí acá") y acá es el registro de lo que pasó, que se lee después.
 */
export const TEXTO_MOTIVO_SIN_TRASLADO: Record<MotivoSinTraslado, string> = {
  ATENDIDO_EN_EL_LUGAR: 'Lo atendiste en el lugar, no hizo falta trasladarlo',
  PACIENTE_RECHAZO: 'El paciente no quiso ir',
  NO_HABIA_PACIENTE: 'No había nadie',
  TRASLADO_POR_OTRO_MEDIO: 'Ya se lo habían llevado por otro medio',
  FALLECIDO: 'Falleció en el lugar',
  PACIENTE_NO_LISTO: 'El paciente no estaba listo',
  UNIDAD_NO_CORRESPONDE: 'La unidad no correspondía a lo que necesitaba',
}

export const TEXTO_MOTIVO_CANCELACION: Record<MotivoCancelacion, string> = {
  AVERIA: 'Avería de la unidad',
  NO_SE_ENCONTRO_PACIENTE: 'No se encontró al paciente',
  DESVIADA: 'Te desviaron a otra urgencia',
  RECHAZADA_POR_PARAMEDICO: 'Devolviste el traslado para que se le busque otra unidad',
  CANCELADA_POR_SOLICITANTE: 'Lo canceló quien lo pidió',
  REASIGNADA: 'Se lo pasaron a otra unidad',
  OTRO: 'Otro motivo',
}
