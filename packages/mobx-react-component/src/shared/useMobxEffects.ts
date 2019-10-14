import { useEffect, useRef, useState } from "react"
import { MobxEffects } from "./MobxEffects"

/**
 * @deprecated Prefer `useMobxLocalState`
 *
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

    const memoEffectsFn = useRef(effectsFn).current
    const runBeforeMount = useRef(realOpts.runBeforeMount)
    if (runBeforeMount.current !== realOpts.runBeforeMount) {
        throw new Error("runBeforeMount option cannot be changed in the lifetime of the component")
    }

    // ok to run them conditionally since the option won't change in the lifetime of the component
    /* eslint-disable react-hooks/rules-of-hooks */

    if (runBeforeMount.current) {
        const [effects] = useState<MobxEffects>(memoEffectsFn)
        useEffect(() => {
            if (!effects) {
                return
            }
            return () => {
                effects.forEach(disposer => disposer())
            }
        }, [effects])
    } else {
        useEffect(() => {
            const effects = memoEffectsFn()
            if (!effects) {
                return
            }
            return () => {
                effects.forEach(disposer => disposer())
            }
        }, [memoEffectsFn])
    }

    /* eslint-enable react-hooks/rules-of-hooks */
}
