import { router } from 'expo-router'

/**
 * Lleva a Inicio desde cualquier pantalla. Con algo apilado encima de las pestañas, lo cierra; sin nada apilado,
 * cambia de pestaña. `dismissTo` solo no alcanza: parado en Traslados o en Perfil no tiene nada que cerrar y no hace
 * nada.
 */
export function irAInicio() {
  if (router.canDismiss()) {
    router.dismissTo('/')
  } else {
    router.navigate('/')
  }
}
