export type EstadoAtencion = 'EN_CAMINO' | 'EN_EL_LUGAR' | 'PACIENTE_RECOGIDO' | 'PACIENTE_ENTREGADO' | 'CANCELADA'

export type MotivoCancelacion = 'AVERIA' | 'NO_SE_ENCONTRO_PACIENTE' | 'DESVIADA' | 'OTRO'

/** `AtencionResponse` del backend. */
export type Atencion = {
  id: number
  incidenteId: number
  ambulanciaId: number
  placa: string
  estado: EstadoAtencion
  horaToma: string
  horaLlegada: string | null
  horaRecogida: string | null
  horaEntrega: string | null
  horaCancelacion: string | null
  motivoCancelacion: MotivoCancelacion | null
  nombrePaciente: string | null
  documentoPaciente: string | null
  centroSaludId: number | null
  destinoDescripcion: string | null
}
