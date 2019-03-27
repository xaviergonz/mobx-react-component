import { observable } from "mobx"
import { useState } from "react"

export function useMobxObservable<O extends object, D>(
    obsFn: () => O,
    decorators?: { [K in keyof O]?: (...args: any) => any }
): O {
    const [obsObj] = useState(() => observable(obsFn(), decorators))

    return obsObj
}
