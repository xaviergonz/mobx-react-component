import { isUsingMobxStaticRendering } from "../shared/staticRendering"
import { useMobxObserver } from "../shared/useMobxObserver"

export function mobxObserver<T>(
    baseComponent: T,
    options?: {
        displayName?: string
    }
): T & { displayName?: string } {
    const baseComponentAsComponent = (baseComponent as unknown) as React.FC

    if (isUsingMobxStaticRendering()) {
        return baseComponent
    }

    const ObserverComponent = (props: any, ref: any) => {
        return useMobxObserver(() => {
            return baseComponentAsComponent(props, ref)
        }, ObserverComponent.displayName)
    }

    copyStaticProperties(baseComponent, ObserverComponent)

    ObserverComponent.displayName =
        (options ? options.displayName : undefined) ||
        baseComponentAsComponent.displayName ||
        baseComponentAsComponent.name

    return ObserverComponent as any
}

// based on https://github.com/mridgway/hoist-non-react-statics/blob/master/src/index.js
const hoistBlackList: any = {
    $$typeof: true,
    render: true,
    compare: true,
    type: true,
}

function copyStaticProperties(base: any, target: any) {
    Object.keys(base).forEach((key) => {
        if (base.hasOwnProperty(key) && !hoistBlackList[key]) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(base, key)!)
        }
    })
}
