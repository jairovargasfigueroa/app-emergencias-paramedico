import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { Tabs } from 'expo-router'
import { useColorScheme } from 'react-native'

import { coloresClaro, coloresOscuro } from '@/tema/colores'

/**
 * Inicio es lo operativo y abre siempre ahí: el mapa, los incidentes y la atención en curso. Las otras dos son
 * para mirar, no para trabajar.
 */
export default function LayoutPestanas() {
  const esquema = useColorScheme() === 'dark' ? 'dark' : 'light'
  const colores = esquema === 'dark' ? coloresOscuro : coloresClaro

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colores.primario,
        tabBarInactiveTintColor: colores.textoSecundario,
        tabBarStyle: { backgroundColor: colores.superficie, borderTopColor: colores.borde },
        tabBarLabelStyle: { fontFamily: 'IBMPlexSans_500Medium', fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="emergency" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="traslados"
        options={{
          title: 'Traslados',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="local-shipping" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  )
}
