import { ValidationMap, WeakValidationMap } from "react"
import { ToObservableModeWithoutRef } from "../shared/observableWrapper"
import { setOriginalProps } from "../shared/originalProps"
import { isUsingMobxStaticRendering } from "../shared/staticRendering"
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
        displayName?: string
        toObservablePropsMode?: ToObservableModeWithoutRef<ReactComponentProps<T>>
    }
): T & IMobxObserverComponent<ReactComponentProps<T>> {
    if (isUsingMobxStaticRendering()) {
        return baseComponent
    }

    const toObservablePropsMode = (options && options.toObservablePropsMode) || "shallow"
    if ((toObservablePropsMode as any) === "ref") {
        throw new Error(`'ref' is not a valid value for the toObservablePropsMode option`)
    }

    const ObserverComponent = (props: any, ref: any) => {
        // turn props into a shallow observable object
        const obsProps = useMobxAsObservableSource(props, toObservablePropsMode)()
        setOriginalProps(obsProps, props)

        return useMobxObserver(() => {
            return baseComponent(obsProps, ref)
        }, ObserverComponent.displayName)
    }

    copyStaticProperties(baseComponent, ObserverComponent)

    ObserverComponent.displayName =
        (options ? options.displayName : undefined) ||
        baseComponent.displayName ||
        baseComponent.name

    return ObserverComponent as any
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
