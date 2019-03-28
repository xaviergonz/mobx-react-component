import { isObservable, remove, runInAction } from "mobx"
import { useLazyInit } from "../shared/useLazyInit"
import { useObservableRef } from "./useObservableRef"

export function usePropertyInjection<T extends object>(
    state: T,
    propName: keyof T,
    value: T[typeof propName],
    mode: "ref" | "shallow"
): void {
    const boxedObservable = useObservableRef(value, mode)

    useLazyInit(() => {
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
