import { useLayoutEffect, useState } from "react"

export function useEffectMethods(state: any): void {
    const [disposeEffects] = useState(() => {
        return instantiateEffects(state)
    })

    if (disposeEffects) {
        useLayoutEffect(() => disposeEffects, [])
    }
}

function instantiateEffects(state: any) {
    if (typeof state !== "object") {
        // istanbul ignore next
        return undefined
    }

    const effectKeys = []
    // we use for in to even get prototype methods
    for (const k in state) {
        if (typeof k === "string" && k.startsWith("fx_")) {
            effectKeys.push(k)
        }
    }

    if (effectKeys.length <= 0) {
        return undefined
    }

    let effectDisposers: ReadonlyArray<() => any> | undefined = effectKeys.map(k => {
        const fxCreator = state[k]
        if (typeof fxCreator !== "function") {
            // istanbul ignore next
            throw new Error(`function expected for effect key '${k}'`)
        }
        return fxCreator.call(state)
    })
    return () => {
        if (effectDisposers) {
            effectDisposers.forEach(disposer => disposer())
            effectDisposers = undefined
        }
    }
}
