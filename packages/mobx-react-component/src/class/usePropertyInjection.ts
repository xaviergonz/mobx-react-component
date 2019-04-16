import { isObservable, remove, runInAction } from "mobx"
import { useRef } from "react"
import { ObservableWrapperMode } from "../shared/observableWrapper"
import { useMobxAsObservableSource } from "../shared/useMobxAsObservableSource"

export function usePropertyInjection<T extends object>(
    state: T,
    propName: keyof T,
    value: T[typeof propName],
    mode: ObservableWrapperMode
): void {
    const inited = useRef<boolean>(false)
    const boxedObservable = useMobxAsObservableSource(value, mode)

    if (!inited.current) {
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
                return boxedObservable()
            }
        })

        inited.current = true
    }
}
