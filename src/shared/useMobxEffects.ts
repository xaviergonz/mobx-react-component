import { useLayoutEffect } from "react"
import { MobxEffects } from "./MobxEffects"
import { useLazyInit } from "./useLazyInit"

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

    useLayoutEffect(() => disposeEffects, [])
}
