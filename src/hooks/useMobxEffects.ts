import { useLayoutEffect } from "react"
import { useLazyInit } from "../shared/useLazyInit"

export function useMobxEffects(effectsFn: () => ReadonlyArray<() => any>): void {
    const disposeEffects = useLazyInit(() => {
        let effects: ReadonlyArray<() => any> | undefined = effectsFn()
        return () => {
            if (effects) {
                effects.forEach(disposer => disposer())
                effects = undefined
            }
        }
    })

    useLayoutEffect(() => disposeEffects, [])
}
