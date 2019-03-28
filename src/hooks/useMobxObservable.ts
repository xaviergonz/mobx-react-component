import { observable } from "mobx"
import { useLazyInit } from "../shared/useLazyInit"

export function useMobxObservable<O extends object, D>(
    obsFn: () => O,
    decorators?: { [K in keyof O]?: (...args: any) => any }
): O {
    return useLazyInit(() => observable(obsFn(), decorators))
}
