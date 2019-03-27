import { action, observable } from "mobx"
import { useState } from "react"

export function useMobxActions<O extends object>(actionsFn: () => O): O {
    const [act] = useState(() => {
        // create actions object
        const actions = actionsFn()

        const decorators: any = {}
        Object.keys(actions).forEach(k => {
            decorators[k] = action.bound
        })

        return observable(actions, decorators)
    })

    return act
}
