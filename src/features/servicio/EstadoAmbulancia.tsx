import { Insignia, type TonoInsignia } from '@/shared/ui/Insignia'

import type { EstadoAmbulancia as Estado } from './api'

const VISTAS: Record<Estado, { tono: TonoInsignia; texto: string }> = {
  DISPONIBLE: { tono: 'verde', texto: 'Disponible' },
  EN_ATENCION: { tono: 'ambar', texto: 'En atención' },
  FUERA_DE_SERVICIO: { tono: 'gris', texto: 'Fuera de servicio' },
}

export function EstadoAmbulancia({ estado }: { estado: Estado }) {
  const vista = VISTAS[estado]
  return (
    <Insignia tono={vista.tono} conPunto>
      {vista.texto}
    </Insignia>
  )
}
