import { action } from "mobx"
import { newObservableWrapper, ObservableWrapperMode } from "../shared/observableWrapper"
import { useLazyInit } from "../shared/useLazyInit"

export function useObservableRef<T>(
    updatedValue: T,
    mode: ObservableWrapperMode
): {
    readonly current: T
} {
    const data = useLazyInit(() => {
        const { get, update } = newObservableWrapper(updatedValue, mode)

        const set = action("updateObservableRef", (newValue: typeof updatedValue) => {
            update(newValue)
        })

        const obj = {
            get current(): T {
                return get()
            }
        }

        return {
            obj,
            set
        }
    })

    data.set(updatedValue)

    return data.obj
}