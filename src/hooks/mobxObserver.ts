import { isUsingStaticRendering } from "mobx-react-lite"
import { setOriginalProps } from "../shared/originalProps"
import { useMobxObserver } from "../shared/useMobxObserver"
import { useMobxObservableRefs } from "./useMobxObservableRefs"

export function mobxObserver<T extends React.FC<any>>(baseComponent: T): T {
    if (isUsingStaticRendering()) {
        return baseComponent
    }

    const baseComponentName = baseComponent.displayName || baseComponent.name

    const observerComponent = (props: any, ref: any) => {
        return useMobxObserver(() => {
            // turn props into a shallow observable object
            const obs = useMobxObservableRefs(
                {
                    props
                },
                {
                    props: "shallow"
                }
            )
            setOriginalProps(obs.props, props)

            return baseComponent(obs.props, ref)
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
