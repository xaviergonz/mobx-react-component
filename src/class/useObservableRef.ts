import { action } from "mobx"
import { useState } from "react"
import { newObservableWrapper } from "../shared/observableWrapper"

export function useObservableRef<T>(
    updatedValue: T,
    mode: "ref" | "shallow"
): {
    readonly current: T
} {
    const [data] = useState(() => {
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
