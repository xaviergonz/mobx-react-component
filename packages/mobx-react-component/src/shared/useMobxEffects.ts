import { useEffect, useRef } from "react"
import { MobxEffects } from "./MobxEffects"

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
    const disposeEffects = useRef<(() => void) | null>(null)
    if (!disposeEffects.current) {
        let effects: MobxEffects | undefined = effectsFn()
        disposeEffects.current = () => {
            if (effects) {
                effects.forEach(disposer => disposer())
                effects = undefined
            }
        }
    }

    useEffect(() => disposeEffects.current!, [])
}
