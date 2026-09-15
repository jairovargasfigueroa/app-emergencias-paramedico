import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useEffect, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, H2, Paragraph, Sheet, Spinner, Text, YStack, useTheme } from 'tamagui'

import { BotonPrincipal } from '@/shared/ui/BotonPrincipal'

import type { IncidenteYaTomado } from './api'

type Props = {
  /** Contexto del 409. Con `null` el diálogo está cerrado. */
  contexto: IncidenteYaTomado | null
  enviando: boolean
  onSumarse: () => void
  onDesistir: () => void
}

function textoUnidades(placas: string[]) {
  if (placas.length === 0) {
    return { antes: 'Otra unidad ya acude a este incidente.', placas: '', despues: '' }
  }
  if (placas.length === 1) {
    return { antes: 'La unidad ', placas: placas[0], despues: ' ya acude a este incidente.' }
  }
  return {
    antes: 'Las unidades ',
    placas: `${placas.slice(0, -1).join(', ')} y ${placas[placas.length - 1]}`,
    despues: ' ya acuden a este incidente.',
  }
}

function textoAfectadosReportados(cantidad: number | null) {
  if (cantidad === null) {
    return 'No se reportaron afectados.'
  }
  return cantidad === 1 ? 'Hay 1 afectado reportado.' : `Hay ${cantidad} afectados reportados.`
}

/**
 * PB-04 CA-03 y CA-05: la toma llegó tarde. Se muestra quién acude y cuántos afectados hay; sumarse llama a
 * `/sumarse` y desistir no registra nada. Todo llega por props: el contenido se pinta en un portal.
 */
export function DialogoSumarse({ contexto, enviando, onSumarse, onDesistir }: Props) {
  const margenes = useSafeAreaInsets()
  const tema = useTheme()
  // Mientras el diálogo se cierra, sigue mostrando el último contexto en lugar de quedar vacío.
  const [mostrado, setMostrado] = useState(contexto)

  useEffect(() => {
    if (contexto) {
      setMostrado(contexto)
    }
  }, [contexto])

  const unidades = textoUnidades(mostrado?.unidadesAcudiendo.map((unidad) => unidad.placa) ?? [])

  return (
    <Sheet
      modal
      open={contexto !== null}
      onOpenChange={(abierto: boolean) => {
        if (!abierto && !enviando) {
          onDesistir()
        }
      }}
      snapPointsMode="fit"
      dismissOnSnapToBottom
      dismissOnOverlayPress={!enviando}
    >
      <Sheet.Overlay bg="$velo" transition="quick" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
      <Sheet.Frame
        gap={20}
        px={20}
        pt={28}
        pb={margenes.bottom + 24}
        borderTopLeftRadius={22}
        borderTopRightRadius={22}
        bg="$superficie"
      >
        <YStack width={52} height={52} rounded={999} bg="$enAtencionTinte" items="center" justify="center">
          <MaterialCommunityIcons name="ambulance" size={26} color={tema.enAtencionTexto?.val} />
        </YStack>

        <YStack gap={8}>
          <H2 color="$texto" fontSize={24} lineHeight={30} fontWeight="600">
            Otra unidad ya acude
          </H2>
          <Paragraph color="$textoSecundario" fontSize={16} lineHeight={24}>
            {unidades.antes}
            {unidades.placas ? (
              <Text color="$texto" fontFamily="$mono" fontWeight="500">
                {unidades.placas}
              </Text>
            ) : null}
            {`${unidades.despues} `}
            <Text color="$texto" fontWeight="600">
              {textoAfectadosReportados(mostrado?.cantidadAfectados ?? null)}
            </Text>
            {' ¿Quieres sumarte?'}
          </Paragraph>
        </YStack>

        <YStack gap={10}>
          <BotonPrincipal
            disabled={enviando}
            opacity={enviando ? 0.7 : 1}
            icon={enviando ? <Spinner color="$primarioTexto" /> : undefined}
            onPress={onSumarse}
          >
            <Button.Text color="$primarioTexto" fontSize={17} fontWeight="600">
              Sumarme
            </Button.Text>
          </BotonPrincipal>
          <Button
            height={52}
            rounded={14}
            bg="$superficie"
            borderColor="$bordeFuerte"
            disabled={enviando}
            onPress={onDesistir}
          >
            <Button.Text color="$texto" fontSize={16} fontWeight="500">
              Desistir
            </Button.Text>
          </Button>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  )
}
