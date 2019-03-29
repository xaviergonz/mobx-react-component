import { isObservable } from "mobx"
import { useLazyInit } from "../shared/useLazyInit"

export function useMobxObservable<O>(obsFn: () => O): O {
    return useLazyInit(() => {
        const obs = obsFn()
        if (!isObservable(obs)) {
            throw new Error("expected an observable")
        }
        return obs
    })
}
