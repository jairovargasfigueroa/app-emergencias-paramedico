import type { ReactNode } from 'react'
import { Button, Paragraph, Spinner, Text, XStack, YStack } from 'tamagui'

import { esSinAtencion, estadosDePeligro, type Afirmacion, type ResumenIa } from './api'
import { GravedadPreliminar } from './GravedadPreliminar'
import {
  textoCorroboracion,
  textoPeligro,
  textoPeligroSinConfirmar,
  textoPersonas,
  textoTipoEvento,
} from './textos'
import { useResumenEnVivo } from './useResumenEnVivo'

type Props = {
  incidenteId: number
  /**
   * En la atención en curso, la tarjeta de lo que se sabe ya muestra los puntos clave y la gravedad: aquí va solo lo
   * que la completa, para no leer lo mismo dos veces.
   */
  completaLaTarjeta?: boolean
}

/**
 * Lo que la IA juntó de las alertas y las evidencias. Se lee con la ambulancia en marcha: letra grande, bloques cortos
 * y solo lo que aporta al paramédico. Lo dudoso (contradicciones y límites) aparece cuando lo hay. Es apoyo: no es un
 * diagnóstico ni un triaje.
 */
export function SeccionResumen({ incidenteId, completaLaTarjeta = false }: Props) {
  const consulta = useResumenEnVivo(incidenteId)
  const resumen = consulta.data?.resumen
  // Lo que ya se tenía tampoco se muestra: la API dejó de darlo porque la unidad no atiende el incidente.
  const sinAtencion = esSinAtencion(consulta.error)

  // La tarjeta ya dice si está cargando, si falló o si todavía no hay resumen: aquí solo se agrega lo que la completa.
  if (completaLaTarjeta && !resumen) {
    return null
  }

  return (
    <YStack gap={14}>
      <Text color="$texto" fontSize={20} lineHeight={26} fontWeight="600">
        {completaLaTarjeta ? 'Más de lo que se sabe' : 'Lo que se sabe'}
      </Text>

      {sinAtencion ? (
        <Paragraph color="$textoSecundario" fontSize={16} lineHeight={23}>
          La información de la IA se ve cuando tu unidad atiende este incidente.
        </Paragraph>
      ) : consulta.isPending ? (
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
        <ContenidoResumen resumen={resumen} completaLaTarjeta={completaLaTarjeta} />
      ) : (
        <Paragraph color="$textoSecundario" fontSize={16} lineHeight={23}>
          Todavía no hay un resumen. Aparece aquí solo cuando esté listo.
        </Paragraph>
      )}
    </YStack>
  )
}

function ContenidoResumen({ resumen, completaLaTarjeta }: { resumen: ResumenIa; completaLaTarjeta: boolean }) {
  const peligros = estadosDePeligro(resumen)

  return (
    <YStack gap={18}>
      {completaLaTarjeta ? null : (
        <>
          <Paragraph color="$texto" fontSize={19} lineHeight={27} fontWeight="500">
            {resumen.summary}
          </Paragraph>

          <GravedadPreliminar gravedad={resumen.severity} />
        </>
      )}

      <YStack gap={4} px={14} py={12} rounded={12} bg="$fondo">
        <Text color="$texto" fontSize={17} lineHeight={23} fontWeight="600">
          {textoTipoEvento(resumen.eventType)}
        </Text>
        <Text color="$texto" fontSize={16} lineHeight={22}>
          {textoPersonas(resumen.people)}
        </Text>
      </YStack>

      {peligros.length > 0 ? (
        <Bloque titulo="Peligros en el lugar">
          <XStack flexWrap="wrap" gap={8}>
            {peligros.map((peligro) => (
              <XStack key={peligro.type} items="center" height={34} px={12} rounded={999} bg="$enAtencionTinte">
                <Text color="$enAtencionTexto" fontSize={16} fontWeight="600">
                  {peligro.status === 'unconfirmed' ? textoPeligroSinConfirmar(peligro) : textoPeligro(peligro.type)}
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

      {/* Lo dudoso aparece solo cuando lo hay: un bloque vacío es ruido para quien va en camino. */}
      {resumen.conflicts.length > 0 ? (
        <Bloque titulo="Contradicciones">
          {resumen.conflicts.map((contradiccion, indice) => (
            <ItemAfirmacion key={indice} afirmacion={contradiccion} destacado />
          ))}
        </Bloque>
      ) : null}

      {resumen.limitations.length > 0 ? (
        <Bloque titulo="Lo que no se puede saber">
          {resumen.limitations.map((limite, indice) => (
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
          ))}
        </Bloque>
      ) : null}

      {/* Una nota al pie y no una etiqueta arriba: que no se lea como un dato confirmado, sin quitarle lugar a los datos. */}
      <Text color="$textoSecundario" fontSize={13} lineHeight={18}>
        Preliminar, armado automáticamente con lo que reportaron.
      </Text>
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

/** Una afirmación corta y cuántas personas la reportaron. */
function ItemAfirmacion({ afirmacion, destacado = false }: { afirmacion: Afirmacion; destacado?: boolean }) {
  const detalle = textoCorroboracion(afirmacion.corroboratingAlerts)

  return (
    <YStack gap={3} pl={12} borderLeftWidth={3} borderColor={destacado ? '$enAtencion' : '$bordeFuerte'}>
      <Paragraph color="$texto" fontSize={17} lineHeight={24}>
        {afirmacion.text}
      </Paragraph>
      {detalle ? (
        <Text color="$textoSecundario" fontSize={14} lineHeight={19}>
          {detalle}
        </Text>
      ) : null}
    </YStack>
  )
}
