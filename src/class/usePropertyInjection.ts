import { isObservable, remove, runInAction } from "mobx"
import { useState } from "react"
import { useObservableRef } from "./useObservableRef"

export function usePropertyInjection<T extends object>(
    state: T,
    propName: keyof T,
    value: T[typeof propName]
): void {
    const boxedObservable = useObservableRef(value, true)

    useState(() => {
        if (isObservable(state)) {
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
                return boxedObservable.current
            }
        })
    })
}
