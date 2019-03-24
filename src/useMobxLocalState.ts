import { useEffect, useState } from "react"
import { IMobxLocalStateOptions, MobxLocalState } from "./MobxLocalState"

export function useMobxLocalState<T extends MobxLocalState<any>>(
    constructFn: () => T,
    props: T extends MobxLocalState<infer P> ? P : never,
    opts?: IMobxLocalStateOptions<T extends MobxLocalState<infer P> ? P : never>
): T {
    const [instance] = useState(() => {
        const inst = constructFn()
        inst._instantiate(props, opts)
        return inst
    })

    useEffect(() => instance._dispose.bind(instance), [])

    instance._updateProps(props)

    return instance
}
