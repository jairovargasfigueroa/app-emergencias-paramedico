import { useQuery } from '@tanstack/react-query'
import { Text, XStack, YStack } from 'tamagui'

import { esSinAtencion, type Evidencia, type Modalidad } from '@/features/resumen/api'
import { resumenIncidenteQuery } from '@/features/resumen/queries'

import { AudioEvidencia } from './AudioEvidencia'
import { AvisoSinAtencion } from './AvisoSinAtencion'
import { FotoEvidencia } from './FotoEvidencia'
import { VideoEvidencia } from './VideoEvidencia'

const TITULOS: Record<Modalidad, string> = {
  IMAGEN: 'Foto',
  AUDIO: 'Audio',
  VIDEO: 'Video',
}

/**
 * Los archivos que mandaron con las alertas. Llegan con el resumen (misma consulta, que `SeccionResumen` mantiene al
 * día) y se ven aunque la IA no los haya analizado. Sin archivos, la sección no aparece. Si la unidad no atiende el
 * incidente, la API no los da y en su lugar queda una nota.
 */
export function SeccionEvidencias({ incidenteId }: { incidenteId: number }) {
  const consulta = useQuery(resumenIncidenteQuery(incidenteId))
  const evidencias = consulta.data?.evidencias ?? []

  if (esSinAtencion(consulta.error)) {
    return (
      <YStack gap={14}>
        <Text color="$texto" fontSize={14} fontWeight="600">
          Fotos, audios y videos
        </Text>
        <AvisoSinAtencion />
      </YStack>
    )
  }

  if (evidencias.length === 0) {
    return null
  }

  return (
    <YStack gap={14}>
      <Text color="$texto" fontSize={14} fontWeight="600">
        Fotos, audios y videos
      </Text>
      {evidencias.map((evidencia) => (
        <TarjetaEvidencia key={evidencia.evidenciaId} evidencia={evidencia} />
      ))}
    </YStack>
  )
}

function TarjetaEvidencia({ evidencia }: { evidencia: Evidencia }) {
  return (
    <YStack gap={10}>
      <XStack items="center" gap={8}>
        <Text color="$texto" fontSize={16} fontWeight="600">
          {TITULOS[evidencia.modalidad] ?? 'Archivo'}
        </Text>
        {evidencia.estado === 'SUBIDA' ? (
          <Text color="$textoSecundario" fontSize={14}>
            · La IA todavía no lo revisó
          </Text>
        ) : evidencia.estado === 'FALLIDA' ? (
          <Text color="$textoSecundario" fontSize={14}>
            · La IA no pudo revisarlo
          </Text>
        ) : null}
      </XStack>
      {evidencia.modalidad === 'IMAGEN' ? (
        <FotoEvidencia evidenciaId={evidencia.evidenciaId} />
      ) : evidencia.modalidad === 'AUDIO' ? (
        <AudioEvidencia evidencia={evidencia} />
      ) : (
        <VideoEvidencia evidencia={evidencia} />
      )}
    </YStack>
  )
}
