import { AccionesTomar } from '@/features/incidentes/AccionesTomar'
import { PantallaIncidente } from '@/features/incidentes/PantallaIncidente'

export default function Incidente() {
  return <PantallaIncidente acciones={(incidente) => <AccionesTomar incidente={incidente} />} />
}
