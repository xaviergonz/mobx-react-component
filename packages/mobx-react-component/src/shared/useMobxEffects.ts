import { useEffect, useRef } from "react"
import { MobxEffects } from "./MobxEffects"

/**
 * Registers some mobx effects that will start once the component is mounted and
 * get disposed once it is unmounted.
 *
 * The optional `options` parameter accepts the following options:
 * - `runBeforeMount`: run the effects right away, before the component is mounted (false by default).
 *
 * ```ts
 * useMobxEffects(() => [
 *   reaction(() => someObservable, () => {
 *     // reaction code
 *   })
 * ])
 * ```
 */
export function useMobxEffects(
    effectsFn: () => MobxEffects,
    options?: { runBeforeMount?: boolean }
): void {
    const realOpts = {
        runBeforeMount: false,
        ...options
    }

    if (realOpts.runBeforeMount) {
        const effects = useRef<MobxEffects | null>(null)
        if (!effects.current) {
            effects.current = effectsFn()
        }
        useEffect(() => {
            const disposers = effects.current
            if (!disposers) {
                return
            }
            return () => {
                disposers.forEach(disposer => disposer())
            }
        }, [effects, effects.current])
    } else {
        useEffect(() => {
            const effects = effectsFn()
            if (!effects) {
                return
            }
            return () => {
                effects.forEach(disposer => disposer())
            }
        }, [])
    }
}
