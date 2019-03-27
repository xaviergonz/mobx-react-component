import { action, observable, set } from "mobx"
import { useState } from "react"

export function useMobxObsRefs<T extends object>(values: T): T {
    const [data] = useState(() => {
        const decorators: any = {}
        Object.keys(values).forEach(k => {
            decorators[k] = observable.ref
        })

        const obsObj = observable(values, decorators)
        const update = action("updateObservableRefs", (currentValues: T) => {
            Object.entries(currentValues).forEach(([k, v]) => {
                set(obsObj, k, v)
            })
        })

        return {
            obsObj,
            update
        }
    })

    data.update(values)

    return data.obsObj
}
