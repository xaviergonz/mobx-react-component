import { action, isObservable, observable, remove, runInAction } from "mobx"
import { useState } from "react"
import { useSkippingForceUpdate } from "./utils"

export function usePropertyInjection<T extends object>(
    state: T,
    propName: keyof T,
    value: T[typeof propName]
): void {
    const [updateInjectedProperty] = useState(() => {
        const boxedObservable = observable.box(value, { deep: false })

        const stateObservable = isObservable(state)
        if (stateObservable) {
            runInAction(() => {
                remove(state as any, propName)
            })
        } else {
            delete (state as any)[propName]
        }

        // define properties in the state
        Object.defineProperty(state, propName, {
            configurable: true,
            enumerable: true,
            get() {
                return boxedObservable.get()
            }
        })

        return action(`updateInjectedProperty(${propName})`, (newValue: typeof value) => {
            boxedObservable.set(newValue)
        })
    })

    useSkippingForceUpdate(() => {
        updateInjectedProperty(value)
    })
}
