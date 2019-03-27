import { action, observable } from "mobx"
import { useState } from "react"

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

    data.set(updatedValue)

    return data.obj
}
