import * as React from "react"
import { isUsingMobxStaticRendering } from "../shared/staticRendering"
import { useMobxObserver } from "../shared/useMobxObserver"

export function mobxObserver<C, DP>(
    baseComponent: C,
    options?: {
        displayName?: string
        defaultProps?: DP
    }
): C & { displayName?: string; defaultProps: DP } {
    if (isUsingMobxStaticRendering()) {
        return baseComponent as any
    }

    const baseComponentAsComponent = baseComponent as unknown as React.FC
    let renderComponent: any = baseComponentAsComponent

    // extract memo
    const memoFn = renderComponent.type
    const isMemo = !!memoFn
    const memoCompare = isMemo ? renderComponent.compare : null

    if (isMemo) {
        renderComponent = memoFn
    }

    // extract forward ref
    const forwardRefFn = renderComponent.render
    const isForwardRef = !!forwardRefFn

    if (isForwardRef) {
        renderComponent = forwardRefFn
    }

    let ObserverComponent: any = (props: any, ref: any) => {
        return useMobxObserver(() => {
            return renderComponent(props, ref)
        }, ObserverComponent.displayName)
    }

    // re-apply forward ref if needed
    if (isForwardRef) {
        ObserverComponent = React.forwardRef(ObserverComponent)
    }

    // re-apply memo if needed
    if (isMemo) {
        ObserverComponent = React.memo(ObserverComponent, memoCompare)
    }

    copyStaticProperties(baseComponentAsComponent, ObserverComponent)

    ObserverComponent.displayName =
        options?.displayName ||
        baseComponentAsComponent.displayName ||
        baseComponentAsComponent.name

    ObserverComponent.defaultProps = options?.defaultProps || baseComponentAsComponent.defaultProps

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
