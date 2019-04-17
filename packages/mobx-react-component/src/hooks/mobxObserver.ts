import { ValidationMap, WeakValidationMap } from "react"
import { ToObservableModeWithoutRef } from "../shared/observableWrapper"
import { setOriginalProps } from "../shared/originalProps"
import { isUsingStaticRendering } from "../shared/staticRendering"
import { useMobxAsObservableSource } from "../shared/useMobxAsObservableSource"
import { useMobxObserver } from "../shared/useMobxObserver"

export interface IMobxObserverComponent<P> {
    propTypes?: WeakValidationMap<P>
    contextTypes?: ValidationMap<any>
    defaultProps?: Partial<P>
    displayName?: string
}

type ReactComponentProps<T extends React.FC<any>> = T extends React.FC<infer P> ? P : never

export function mobxObserver<T extends React.FC<any>>(
    baseComponent: T,
    options?: {
        toObservablePropsMode?: ToObservableModeWithoutRef<ReactComponentProps<T>>
    }
): T & IMobxObserverComponent<ReactComponentProps<T>> {
    if (isUsingStaticRendering()) {
        return baseComponent
    }

    const baseComponentName = baseComponent.displayName || baseComponent.name
    const toObservablePropsMode = (options && options.toObservablePropsMode) || "shallow"
    if (toObservablePropsMode === "ref") {
        throw new Error(`'ref' is not a valid value for the toObservablePropsMode option`)
    }

    const observerComponent = (props: any, ref: any) => {
        // turn props into a shallow observable object
        const obsProps = useMobxAsObservableSource(props, toObservablePropsMode)()
        setOriginalProps(obsProps, props)

        return useMobxObserver(() => {
            return baseComponent(obsProps, ref)
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
