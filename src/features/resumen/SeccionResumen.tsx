import Feather from '@expo/vector-icons/Feather'
import type { ReactNode } from 'react'
import { Button, Paragraph, Spinner, Text, XStack, YStack, useTheme } from 'tamagui'

import type { Afirmacion, ResumenIa } from './api'
import { GravedadPreliminar } from './GravedadPreliminar'
import { textoCorroboracion, textoPeligro, textoPersonas, textoTipoEvento } from './textos'
import { useResumenEnVivo } from './useResumenEnVivo'

/**
 * Lo que la IA juntó de las alertas y las evidencias. Se lee con la ambulancia en marcha: letra grande, bloques cortos
 * y lo dudoso (contradicciones y límites) siempre a la vista. Es apoyo: no es un diagnóstico ni un triaje.
 */
export function SeccionResumen({ incidenteId }: { incidenteId: number }) {
  const consulta = useResumenEnVivo(incidenteId)
  const resumen = consulta.data?.resumen

  return (
    <YStack gap={14}>
      <YStack gap={6}>
        <Text color="$texto" fontSize={20} lineHeight={26} fontWeight="600">
          Lo que se sabe
        </Text>
        <EtiquetaPreliminar />
      </YStack>

      {consulta.isPending ? (
        <XStack items="center" gap={10} py={8}>
          <Spinner color="$primario" />
          <Text color="$textoSecundario" fontSize={16}>
            Cargando el resumen…
          </Text>
        </XStack>
      ) : consulta.isError && !consulta.data ? (
        <YStack gap={10}>
          <Paragraph color="$textoSecundario" fontSize={16} lineHeight={23}>
            No se pudo cargar el resumen.
          </Paragraph>
          <Button
            self="flex-start"
            height={44}
            rounded={12}
            bg="$superficie"
            borderColor="$bordeFuerte"
            onPress={() => void consulta.refetch()}
          >
            <Button.Text color="$texto" fontSize={16} fontWeight="500">
              Reintentar
            </Button.Text>
          </Button>
        </YStack>
      ) : resumen ? (
        <ContenidoResumen resumen={resumen} />
      ) : (
        <Paragraph color="$textoSecundario" fontSize={16} lineHeight={23}>
          Todavía no hay un resumen. Aparece aquí solo cuando esté listo.
        </Paragraph>
      )}
    </YStack>
  )
}

/** Avisa de dónde sale todo lo de abajo, para que no se lea como un dato confirmado. */
function EtiquetaPreliminar() {
  const tema = useTheme()
  return (
    <XStack self="flex-start" items="center" gap={6} height={28} px={10} rounded={999} bg="$fueraServicioTinte">
      <Feather name="alert-circle" size={14} color={tema.fueraServicioTexto?.val} />
      <Text color="$fueraServicioTexto" fontSize={14} fontWeight="500">
        Preliminar · generado por IA
      </Text>
    </XStack>
  )
}

function ContenidoResumen({ resumen }: { resumen: ResumenIa }) {
  return (
    <YStack gap={18}>
      <Paragraph color="$texto" fontSize={19} lineHeight={27} fontWeight="500">
        {resumen.summary}
      </Paragraph>

      <GravedadPreliminar gravedad={resumen.severity} />

      <YStack gap={4} px={14} py={12} rounded={12} bg="$fondo">
        <Text color="$texto" fontSize={17} lineHeight={23} fontWeight="600">
          {textoTipoEvento(resumen.eventType)}
        </Text>
        <Text color="$texto" fontSize={16} lineHeight={22}>
          {textoPersonas(resumen.people)}
        </Text>
      </YStack>

      {resumen.hazards.length > 0 ? (
        <Bloque titulo="Peligros en el lugar">
          <XStack flexWrap="wrap" gap={8}>
            {resumen.hazards.map((peligro) => (
              <XStack key={peligro} items="center" height={34} px={12} rounded={999} bg="$enAtencionTinte">
                <Text color="$enAtencionTexto" fontSize={16} fontWeight="600">
                  {textoPeligro(peligro)}
                </Text>
              </XStack>
            ))}
          </XStack>
        </Bloque>
      ) : null}

      {resumen.findings.length > 0 ? (
        <Bloque titulo="Hallazgos">
          {resumen.findings.map((hallazgo, indice) => (
            <ItemAfirmacion key={indice} afirmacion={hallazgo} />
          ))}
        </Bloque>
      ) : null}

      {resumen.risks.length > 0 ? (
        <Bloque titulo="Riesgos">
          {resumen.risks.map((riesgo, indice) => (
            <ItemAfirmacion key={indice} afirmacion={riesgo} />
          ))}
        </Bloque>
      ) : null}

      {/* Lo dudoso no se esconde: con o sin contenido, estos dos bloques se ven siempre. */}
      <Bloque titulo="Contradicciones">
        {resumen.conflicts.length > 0 ? (
          resumen.conflicts.map((contradiccion, indice) => (
            <ItemAfirmacion key={indice} afirmacion={contradiccion} destacado />
          ))
        ) : (
          <TextoVacio>Los reportes no se contradicen.</TextoVacio>
        )}
      </Bloque>

      <Bloque titulo="Lo que no se puede saber">
        {resumen.limitations.length > 0 ? (
          resumen.limitations.map((limite, indice) => (
            <Paragraph
              key={indice}
              color="$texto"
              fontSize={17}
              lineHeight={24}
              pl={12}
              borderLeftWidth={3}
              borderColor="$bordeFuerte"
            >
              {limite}
            </Paragraph>
          ))
        ) : (
          <TextoVacio>La IA no señaló límites.</TextoVacio>
        )}
      </Bloque>
    </YStack>
  )
}

function Bloque({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <YStack gap={10}>
      <Text color="$textoSecundario" fontSize={15} fontWeight="600">
        {titulo}
      </Text>
      {children}
    </YStack>
  )
}

function TextoVacio({ children }: { children: string }) {
  return (
    <Paragraph color="$textoSecundario" fontSize={16} lineHeight={23}>
      {children}
    </Paragraph>
  )
}

/** Una afirmación corta con cuántas alertas la respaldan y, si la IA la dedujo, que es deducida. */
function ItemAfirmacion({ afirmacion, destacado = false }: { afirmacion: Afirmacion; destacado?: boolean }) {
  const detalle = [
    textoCorroboracion(afirmacion.corroboratingAlerts),
    afirmacion.basis === 'inferred' ? 'Deducido, no visto' : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <YStack gap={3} pl={12} borderLeftWidth={3} borderColor={destacado ? '$enAtencion' : '$bordeFuerte'}>
      <Paragraph color="$texto" fontSize={17} lineHeight={24}>
        {afirmacion.text}
      </Paragraph>
      <Text color="$textoSecundario" fontSize={14} lineHeight={19}>
        {detalle}
      </Text>
    </YStack>
  )
}
