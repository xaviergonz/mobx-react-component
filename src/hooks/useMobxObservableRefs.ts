import { action } from "mobx"
import {
    newObservableWrapper,
    ObservableWrapperMode,
    ObservableWrapperUpdater
} from "../shared/observableWrapper"
import { useLazyInit } from "../shared/useLazyInit"

export function useMobxObservableRefs<O extends object>(
    values: O,
    decorators?: { [K in keyof O]?: ObservableWrapperMode }
): O {
    const data = useLazyInit(() => {
        const _decorators: { [k: string]: ObservableWrapperMode | undefined } = {
            ...decorators
        } as any
        const _values: any = values

        const obsObj: any = {}
        const obsObjUpdaters: Record<any, ObservableWrapperUpdater<any>> = {}

        function defineProp(prop: string | symbol, v: any, mode: ObservableWrapperMode) {
            const { get, update } = newObservableWrapper(v, mode)

            obsObjUpdaters[prop as any] = update

            Object.defineProperty(obsObj, prop, {
                enumerable: true,
                configurable: true,
                get() {
                    return get()
                }
            })
        }

        Object.entries(_values).forEach(([propName, initialValue]) => {
            const mode = _decorators[propName] || "ref"
            defineProp(propName, initialValue, mode)
        })

        const updateAll = action("updateMobxObservableRefs", (currentValues: O) => {
            Object.entries(currentValues).forEach(([k, v]) => {
                obsObjUpdaters[k](v)
            })
        })

        return {
            obsObj,
            updateAll
        }
    })

    data.updateAll(values)

    return data.obsObj
}
