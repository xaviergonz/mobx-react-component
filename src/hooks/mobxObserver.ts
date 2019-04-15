import { ValidationMap, WeakValidationMap } from "react"
import { setOriginalProps } from "../shared/originalProps"
import { isUsingStaticRendering } from "../shared/staticRendering"
import { useMobxObserver } from "../shared/useMobxObserver"
import { useMobxAsObservableSource } from "./useMobxAsObservableSource"

export interface IMobxObserverComponent<P> {
    propTypes?: WeakValidationMap<P>
    contextTypes?: ValidationMap<any>
    defaultProps?: Partial<P>
    displayName?: string
}

export function mobxObserver<T extends React.FC<any>>(
    baseComponent: T
): T & IMobxObserverComponent<T extends React.FC<infer P> ? P : never> {
    if (isUsingStaticRendering()) {
        return baseComponent
    }

    const baseComponentName = baseComponent.displayName || baseComponent.name

    const observerComponent = (props: any, ref: any) => {
        return useMobxObserver(() => {
            // turn props into a shallow observable object
            const obsProps = useMobxAsObservableSource(props, "shallow")
            setOriginalProps(obsProps(), props)

            return baseComponent(obsProps(), ref)
        }, observerComponent.displayName)
    }
    observerComponent.displayName = baseComponentName

    copyStaticProperties(baseComponent, observerComponent)

    return observerComponent as any
}

// based on https://github.com/mridgway/hoist-non-react-statics/blob/master/src/index.js
const hoistBlackList: any = {
    $$typeof: true,
    render: true,
    compare: true,
    type: true
}

function copyStaticProperties(base: any, target: any) {
    Object.keys(base).forEach(key => {
        if (base.hasOwnProperty(key) && !hoistBlackList[key]) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(base, key)!)
        }
    })
}
