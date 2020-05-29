import { memo, ReactElement } from "react"
import { useMobxObserver } from "./useMobxObserver"

interface IObserverProps {
    children?(): ReactElement<any>
    render?(): ReactElement<any>
}

const ObserverWrapper = ({ children, render }: IObserverProps) => {
    const component = children || render
    return useMobxObserver(component!)
}
ObserverWrapper.propTypes = {
    children: ObserverPropsCheck,
    render: ObserverPropsCheck,
}

const Observer = memo(ObserverWrapper)
Observer.displayName = "Observer"

export { Observer }

function ObserverPropsCheck(
    props: { [k: string]: any },
    key: string,
    componentName: string,
    _location: any,
    propFullName: string
) {
    const extraKey = key === "children" ? "render" : "children"
    const hasProp = typeof props[key] === "function"
    const hasExtraProp = typeof props[extraKey] === "function"
    if (hasProp && hasExtraProp) {
        return new Error(
            "MobX Observer: Do not use children and render in the same time in`" + componentName
        )
    }

    if (hasProp || hasExtraProp) {
        return null
    }
    return new Error(
        "Invalid prop `" +
            propFullName +
            "` of type `" +
            typeof props[key] +
            "` supplied to" +
            " `" +
            componentName +
            "`, expected `function`."
    )
}
