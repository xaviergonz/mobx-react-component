import { isUsingStaticRendering } from "mobx-react-lite"
import { useMobxObserver } from "../shared/useMobxObserver"

export function mobxObserver<T extends React.FC<any>>(baseComponent: T): T {
    // The working of observer is explaind step by step in this talk: https://www.youtube.com/watch?v=cPF4iBedoF0&feature=youtu.be&t=1307
    if (isUsingStaticRendering()) {
        return baseComponent
    }

    const baseComponentName = baseComponent.displayName || baseComponent.name

    const wrappedComponent = (props: any, ref: any) => {
        return useMobxObserver(() => baseComponent(props, ref), baseComponentName)
    }
    wrappedComponent.displayName = baseComponentName

    copyStaticProperties(baseComponent, wrappedComponent)

    return wrappedComponent as any
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
