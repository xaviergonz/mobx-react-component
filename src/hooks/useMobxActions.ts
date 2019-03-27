import { action } from "mobx"
import { useState } from "react"

export function useMobxActions<O extends object>(actionsFn: () => O): O {
    const [act] = useState(() => {
        // create actions object
        const actions = actionsFn()

        // make sure each action is bound and with a name
        Object.entries(actions).forEach(([k, v]) => {
            ;(actions as any)[k] = action(k, v.bind(actions))
        })

        return actions
    })

    return act
}
