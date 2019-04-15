import { useEffect } from "react"
import { MobxEffects } from "./MobxEffects"
import { useLazyInit } from "./useLazyInit"

/**
 * Registers some mobx effects.
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
    const disposeEffects = useLazyInit(() => {
        let effects: MobxEffects | undefined = effectsFn()
        return () => {
            if (effects) {
                effects.forEach(disposer => disposer())
                effects = undefined
            }
        }
    })

    useEffect(() => disposeEffects, [])
}
