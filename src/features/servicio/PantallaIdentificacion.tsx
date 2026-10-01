import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { KeyboardAvoidingView, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text, XStack, YStack } from 'tamagui'

import { dispositivoQuery } from '@/shared/sesion/queries'
import { MarcaSga } from '@/shared/ui/MarcaSga'
import { PantallaDeEstado } from '@/shared/ui/PantallaDeEstado'

import { FormularioActivacion } from './FormularioActivacion'
import { FormularioIngreso } from './FormularioIngreso'

/**
 * Entrada a la app, como en una central de verdad: la central crea la cuenta y le entrega al paramédico, en persona, un
 * código de activación. Con ese código activa su teléfono y crea su PIN; de ahí en adelante entra con el PIN y solo
 * desde ese teléfono. Sin la clave del teléfono guardada, se activa; con ella, se pide el PIN.
 */
export function PantallaIdentificacion() {
  const dispositivo = useQuery(dispositivoQuery())

  if (dispositivo.isPending) {
    return <PantallaDeEstado cargando />
  }

  return (
    <Identificacion
      claveDispositivo={dispositivo.data?.claveDispositivo ?? null}
      ultimoTelefono={dispositivo.data?.ultimoTelefono ?? null}
    />
  )
}

type Props = {
  claveDispositivo: string | null
  ultimoTelefono: string | null
}

function Identificacion({ claveDispositivo, ultimoTelefono }: Props) {
  const margenes = useSafeAreaInsets()
  const [modo, setModo] = useState<'pin' | 'activacion'>(claveDispositivo ? 'pin' : 'activacion')
  // El número pasa de un modo al otro tal como quedó escrito.
  const [telefono, setTelefono] = useState(ultimoTelefono ?? '')
  const [aviso, setAviso] = useState<string | null>(null)

  function irAActivacion(telefonoEscrito: string, motivo?: string) {
    setTelefono(telefonoEscrito)
    setAviso(motivo ?? null)
    setModo('activacion')
  }

  function irAlPin(telefonoEscrito: string) {
    setTelefono(telefonoEscrito)
    setAviso(null)
    setModo('pin')
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <YStack flex={1} bg="$fondo" px={24} pt={margenes.top + 40} pb={margenes.bottom + 24}>
          <XStack items="center" gap={12}>
            <MarcaSga tamano={44} />
            <Text color="$textoSecundario" fontSize={15} fontWeight="500">
              SGA · Paramédicos
            </Text>
          </XStack>

          {modo === 'pin' && claveDispositivo ? (
            <FormularioIngreso
              key="pin"
              claveDispositivo={claveDispositivo}
              telefonoInicial={telefono}
              onActivar={irAActivacion}
            />
          ) : (
            <FormularioActivacion
              key="activacion"
              telefonoInicial={telefono}
              aviso={aviso}
              onIngresarConPin={claveDispositivo ? irAlPin : undefined}
            />
          )}
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
