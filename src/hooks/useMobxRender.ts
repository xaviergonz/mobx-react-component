import { IUseObserverOptions, useObserver } from "mobx-react-lite"
import { useForceUpdate } from "../utils"

const useObserverOptions: IUseObserverOptions = {
    useForceUpdate
}

export function useMobxRender<T>(fn: () => T, baseComponentName?: string) {
    return useObserver(fn, baseComponentName, useObserverOptions)
}
