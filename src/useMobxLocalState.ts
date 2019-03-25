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

        const disposeEffects = instantiateEffects(state, (state as any).effects)

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

function instantiateEffects(context: any, effects?: () => ReadonlyArray<() => any>) {
    if (!effects) {
        return undefined
    }

    let effectDisposers: ReadonlyArray<() => any> | undefined = effects.call(context)
    return () => {
        if (effectDisposers) {
            effectDisposers.forEach(disposer => disposer())
            effectDisposers = undefined
        }
    }
}
