import { useLayoutEffect } from "react"
import { MobxEffects } from "./MobxEffects"

/**
 * Registers some mobx effects that will start once the component is mounted and
 * get disposed once it is unmounted.
 *
 * ```ts
 * useMobxEffects(() => [
 *   reaction(() => someObservable, () => {
 *     // reaction code
 *   })
 * ])
 * ```
 */
export function useMobxEffects(effectsFn: () => MobxEffects): void {
    useLayoutEffect(() => {
        const effects = effectsFn()
        if (effects) {
            return () => {
                effects.forEach(disposer => disposer())
            }
        } else {
            return
        }
    }, [])
}
