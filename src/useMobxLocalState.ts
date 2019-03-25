import { action, isObservable, remove, runInAction } from "mobx"
import { useEffect, useState } from "react"
import { IUpdateableObservable, updateableObservable } from "./updateableObservable"

export type IDependencies<T> = { [k in keyof T]?: T[k] }

export function useMobxLocalState<T extends object>(
    constructFn: () => T,
    dependencies?: IDependencies<T>
): T {
    const [data] = useState(() => {
        const state = constructFn()

        let updater
        if (dependencies) {
            const updateObservables: {
                [k: string]: IUpdateableObservable<any>
            } = {}

            const stateObservable = isObservable(state)
            Object.entries(dependencies).forEach(([k, v]: [string, any]) => {
                const initialValue = v
                const mode = (state as any)[k]

                if (stateObservable) {
                    runInAction(() => {
                        remove(state, k)
                    })
                } else {
                    delete (state as any)[k]
                }

                updateObservables[k] = updateableObservable(initialValue, mode)

                // define properties in the state
                Object.defineProperty(state, k, {
                    configurable: true,
                    enumerable: true,
                    get() {
                        return updateObservables[k].get()
                    }
                })
            })

            updater = action("updateDeps", (deps: IDependencies<T>) => {
                Object.entries(deps).forEach(([k, v]: [string, any]) => {
                    updateObservables[k].update(v)
                })
            })
        }

        const disposeEffects = instantiateEffects(state)

        return {
            state,
            disposeEffects,
            updater,
            justUpdated: true
        }
    })

    if (data.disposeEffects) {
        useEffect(() => data.disposeEffects, [])
    }

    if (data.updater && dependencies) {
        if (data.justUpdated) {
            data.justUpdated = false
        } else {
            data.updater(dependencies)
        }
    }

    return data.state
}

function instantiateEffects(state: any) {
    if (typeof state !== "object") {
        // istanbul ignore next
        return undefined
    }

    const effectKeys = Object.keys(state).filter(k => k.startsWith("fx_"))
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
