import { action, observable } from "mobx"
import { useState } from "react"
import { useSkippingForceUpdate } from "../utils"

export function useObservableRef<T>(
    updatedValue: T,
    skipForceUpdate = true
): {
    readonly current: T
} {
    const [data] = useState(() => {
        const boxedObservable = observable.box(updatedValue, { deep: false })

        const set = action(`setObservableRef`, (newValue: typeof updatedValue) => {
            boxedObservable.set(newValue)
        })

        const obj = {
            get current(): T {
                return boxedObservable.get()
            }
        }

        return {
            obj,
            set
        }
    })

    if (skipForceUpdate) {
        useSkippingForceUpdate(() => {
            data.set(updatedValue)
        })
    } else {
        data.set(updatedValue)
    }

    return data.obj
}
