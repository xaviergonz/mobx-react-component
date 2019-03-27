import { useLayoutEffect, useState } from "react"

export function useMobxEffects(effectsFn: () => ReadonlyArray<() => any>): void {
    const [disposeEffects] = useState(() => {
        let effects: ReadonlyArray<() => any> | undefined = effectsFn()
        return () => {
            if (effects) {
                effects.forEach(disposer => disposer())
                effects = undefined
            }
        }
    })

    if (disposeEffects) {
        useLayoutEffect(() => disposeEffects, [])
    }
}
