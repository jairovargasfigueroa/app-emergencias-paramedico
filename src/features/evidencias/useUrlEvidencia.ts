import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { esSinAtencion } from '@/features/resumen/api'

import { urlEvidenciaQuery } from './queries'

/**
 * URL temporal de una evidencia, pedida solo con `pedida` en `true`. Si el archivo no carga (lo normal es que la URL
 * haya vencido), `alFallarCarga` firma otra una vez; si la nueva tampoco carga, queda `fallo` para ofrecer reintentar
 * a mano y no pedir URLs en bucle. `alCargar` rearma el reintento automático para el próximo vencimiento. Con
 * `sinAtencion` la API no la da porque la unidad no atiende el incidente: ahí no se ofrece reintentar.
 */
export function useUrlEvidencia(evidenciaId: number, pedida = true) {
  const consulta = useQuery({ ...urlEvidenciaQuery(evidenciaId), enabled: pedida })
  const [renovo, setRenovo] = useState(false)
  const [fallo, setFallo] = useState(false)

  function alFallarCarga() {
    if (renovo) {
      setFallo(true)
      return
    }
    setRenovo(true)
    void consulta.refetch()
  }

  function alCargar() {
    setRenovo(false)
    setFallo(false)
  }

  function reintentar() {
    alCargar()
    void consulta.refetch()
  }

  return {
    url: consulta.data?.url ?? null,
    cargando: pedida && consulta.isFetching && !consulta.data,
    error: consulta.isError || fallo,
    sinAtencion: esSinAtencion(consulta.error),
    alFallarCarga,
    alCargar,
    reintentar,
  }
}
