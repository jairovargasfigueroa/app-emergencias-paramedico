import Feather from '@expo/vector-icons/Feather'
import { Button, Paragraph, Spinner, Text, XStack, YStack, useTheme } from 'tamagui'

import { tiempoTranscurrido } from '@/shared/formato/tiempo'
import { useAhora } from '@/shared/reloj/useAhora'

import { esSinAtencion, estadosDePeligro, puntosClave, type ResumenIncidente, type TipoPuntoClave } from './api'
import { GravedadPreliminar } from './GravedadPreliminar'
import { textoEvidencias, textoPeligroSinConfirmar } from './textos'
import { useResumenEnVivo } from './useResumenEnVivo'

/** Un ícono por tipo de punto: lo crítico en rojo y el peligro en ámbar, para encontrarlos sin leer todo. */
const ICONOS = {
  what: { icono: 'info', color: 'textoSecundario' },
  people: { icono: 'users', color: 'textoSecundario' },
  hazard: { icono: 'alert-triangle', color: 'enAtencion' },
  critical: { icono: 'alert-octagon', color: 'primario' },
} as const satisfies Record<TipoPuntoClave, unknown>

type Props = {
  incidenteId: number
  /** Vuelve a leer el resumen en voz alta. `null` cuando no se lee: fuera de camino o sin resumen. */
  onRepetir?: (() => void) | null
}

/**
 * Lo que se sabe del incidente a simple vista, sin abrir los detalles: los puntos clave en letra grande y la gravedad
 * estimada. Es apoyo para prepararse en camino, no un diagnóstico ni un triaje. Lo demás (hallazgos, riesgos, lo
 * dudoso) queda en los detalles. Tiene que ser corta: comparte la hoja con el paso siguiente de la atención.
 */
export function TarjetaLoQueSeSabe({ incidenteId, onRepetir = null }: Props) {
  const tema = useTheme()
  const consulta = useResumenEnVivo(incidenteId)
  const ahora = useAhora()

  // La API niega el resumen si la unidad ya no atiende el incidente: lo que se tenía tampoco se muestra.
  if (esSinAtencion(consulta.error)) {
    return <TextoDeEstado>Lo que se sabe del incidente se ve mientras tu unidad lo atiende.</TextoDeEstado>
  }

  if (consulta.isPending) {
    return (
      <XStack items="center" gap={10} py={4}>
        <Spinner color="$primario" />
        <Text color="$textoSecundario" fontSize={15}>
          Cargando lo que se sabe…
        </Text>
      </XStack>
    )
  }

  if (consulta.isError && !consulta.data) {
    return (
      <XStack items="center" justify="space-between" gap={10}>
        <YStack flex={1}>
          <TextoDeEstado>No se pudo cargar lo que se sabe.</TextoDeEstado>
        </YStack>
        <Button height={44} rounded={12} bg="$superficie" borderColor="$bordeFuerte" onPress={() => void consulta.refetch()}>
          <Button.Text color="$texto" fontSize={15} fontWeight="500">
            Reintentar
          </Button.Text>
        </Button>
      </XStack>
    )
  }

  const datos = consulta.data
  const resumen = datos?.resumen
  if (!datos || !resumen) {
    const archivos = datos ? textoEvidencias(datos.evidencias) : ''
    return (
      <TextoDeEstado>
        {archivos
          ? `Todavía no hay un resumen de lo que mandaron (${archivos}). Aparece aquí cuando esté listo.`
          : 'Todavía no hay un resumen. Aparece aquí cuando esté listo.'}
      </TextoDeEstado>
    )
  }

  const sinConfirmar = estadosDePeligro(resumen).filter((peligro) => peligro.status === 'unconfirmed')

  return (
    <YStack gap={12}>
      <YStack gap={8}>
        {puntosClave(resumen).map((punto, indice) => (
          <ItemPuntoClave key={indice} tipo={punto.kind} texto={punto.text} />
        ))}
      </YStack>

      {/* Nadie dijo que terminó: sigue a la vista con la hora de su último reporte, para que no se pierda. */}
      {sinConfirmar.length > 0 ? (
        <YStack gap={4}>
          {sinConfirmar.map((peligro) => (
            <Text key={peligro.type} color="$enAtencionTexto" fontSize={15} lineHeight={21} fontWeight="500">
              {textoPeligroSinConfirmar(peligro)}
            </Text>
          ))}
        </YStack>
      ) : null}

      <GravedadPreliminar gravedad={resumen.severity} />

      <XStack items="center" justify="space-between" gap={10}>
        <Text flex={1} color="$textoSecundario" fontSize={14} lineHeight={19}>
          {textoActualidad(datos, ahora)}
        </Text>
        {/* Grande, para tocarlo con guantes y en movimiento: lo que se oyó mal se vuelve a escuchar. */}
        {onRepetir ? (
          <Button
            height={48}
            px={18}
            rounded={12}
            bg="$superficie"
            borderColor="$bordeFuerte"
            icon={<Feather name="volume-2" size={20} color={tema.texto?.val} />}
            onPress={onRepetir}
          >
            <Button.Text color="$texto" fontSize={16} fontWeight="600">
              Repetir
            </Button.Text>
          </Button>
        ) : null}
      </XStack>
    </YStack>
  )
}

function ItemPuntoClave({ tipo, texto }: { tipo: TipoPuntoClave; texto: string }) {
  const tema = useTheme()
  const { icono, color } = ICONOS[tipo] ?? ICONOS.what
  return (
    <XStack gap={10} items="flex-start">
      <YStack pt={3}>
        <Feather name={icono} size={18} color={tema[color]?.val} />
      </YStack>
      <Paragraph flex={1} color="$texto" fontSize={18} lineHeight={25} fontWeight="500">
        {texto}
      </Paragraph>
    </XStack>
  )
}

function TextoDeEstado({ children }: { children: string }) {
  return (
    <Paragraph color="$textoSecundario" fontSize={15} lineHeight={21}>
      {children}
    </Paragraph>
  )
}

/** "Hace 3 min · 2 fotos · 1 audio": qué tan nuevo es lo que se lee y de cuántos archivos sale. */
function textoActualidad(datos: ResumenIncidente, ahora: number): string {
  const hace = datos.generadoEn ? tiempoTranscurrido(datos.generadoEn, ahora) : null
  return [hace ? hace.charAt(0).toUpperCase() + hace.slice(1) : null, textoEvidencias(datos.evidencias) || null]
    .filter(Boolean)
    .join(' · ')
}
