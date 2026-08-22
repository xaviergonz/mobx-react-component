import { createElement, forwardRef, memo, ReactElement, useContext, useEffect, useRef } from "react"
import { copyStaticProperties } from "../shared/copyStaticProperties"
import { MobxEffects } from "../shared/MobxEffects"
import { ToObservableMode } from "../shared/observableWrapper"
import { setOriginalProps } from "../shared/originalProps"
import { useMobxEffects } from "../shared/useMobxEffects"
import { useMobxObserver } from "../shared/useMobxObserver"
import { ReactContextValue } from "./ReactContextValue"
import { usePropertyInjection } from "./usePropertyInjection"

interface IContextToInject {
    context: React.Context<any>
    propName: string
    toObservableMode: ToObservableMode<any>
}

const contextsToInjectSymbol = Symbol("contextsToInject")

export function injectContext<C extends React.Context<any>>(
    context: C,
    toObservableMode: ToObservableMode<ReactContextValue<C>> = "ref"
) {
    return (targetOrValue: any, propertyKeyOrContext: any) => {
        // Stage 3 decorator support
        if (
            propertyKeyOrContext &&
            typeof propertyKeyOrContext === "object" &&
            "name" in propertyKeyOrContext &&
            typeof propertyKeyOrContext.addInitializer === "function"
        ) {
            const propName = String(propertyKeyOrContext.name)
            propertyKeyOrContext.addInitializer(function (this: any) {
                const prototype = Object.getPrototypeOf(this) as IInternalMobxComponent
                let contextsToInject = Object.prototype.hasOwnProperty.call(
                    prototype,
                    contextsToInjectSymbol
                )
                    ? prototype[contextsToInjectSymbol]
                    : (prototype[contextsToInjectSymbol] = prototype[contextsToInjectSymbol]
                          ? [...prototype[contextsToInjectSymbol]]
                          : [])
                if (!contextsToInject.some((c) => c.propName === propName)) {
                    contextsToInject.push({ context, propName, toObservableMode })
                }
            })
            return
        }

        // Legacy decorator support
        const prototype = targetOrValue as unknown as IInternalMobxComponent
        let contextsToInject = Object.prototype.hasOwnProperty.call(
            prototype,
            contextsToInjectSymbol
        )
            ? prototype[contextsToInjectSymbol]
            : (prototype[contextsToInjectSymbol] = prototype[contextsToInjectSymbol]
                  ? [...prototype[contextsToInjectSymbol]]
                  : [])
        contextsToInject.push({ context, propName: propertyKeyOrContext, toObservableMode })
    }
}

export abstract class MobxComponent<P = {}> implements React.Component<P> {
    // just to keep TS happy for the fake implementation of React.Component
    context!: never
    setState!: never
    forceUpdate!: never
    state!: never
    refs!: never

    readonly props!: React.Component<P>["props"]
    readonly originalProps!: React.Component<P>["props"]

    abstract render(): ReactElement | null

    getEffects?(): MobxEffects
    getBeforeMountEffects?(): MobxEffects

    // disable some non-supported features
    static contextType?: never
    componentDidMount?: never
    shouldComponentUpdate?: never
    componentWillUnmount?: never
    componentDidCatch?: never
    getDerivedStateFromProps?: never
    getDerivedStateFromError?: never
    getSnapshotBeforeUpdate?: never
    componentDidUpdate?: never
    componentWillMount?: never
    componentWillReceiveProps?: never
    UNSAFE_componentWillReceiveProps?: never
    componentWillUpdate?: never
    UNSAFE_componentWillUpdate?: never
}

export interface IMobxComponentOptions<P> {
    toObservablePropsMode?: ToObservableMode<P>
    refEmulation?: boolean
}

export const mobxComponent =
    (
        options?: IMobxComponentOptions<any> // TODO: how to get P here?
    ) =>
    <C extends new () => MobxComponent<any>>(clazz: C, context?: any): C => {
        return _mobxComponent(clazz as any, options || {}, context) as any
    }

interface IInternalMobxComponent {
    [contextsToInjectSymbol]: IContextToInject[]
}

const emptyFunction = () => {}

function _mobxComponent<C extends React.ComponentClass<P>, P>(
    clazz: C,
    options: IMobxComponentOptions<any>,
    context?: any
) {
    const refEmulation = options.refEmulation !== undefined ? options.refEmulation : true
    const displayName = clazz.displayName || clazz.name

    const constructFn = () => {
        const state: MobxComponent<any> & IInternalMobxComponent = new clazz(
            undefined as any
        ) as any

        const contexts = state[contextsToInjectSymbol]

        let useUpdateContexts = emptyFunction
        if (contexts) {
            useUpdateContexts = () => {
                for (const c of contexts) {
                    // ok since contexts is fixed for the lifetime of the component
                    /* eslint-disable react-hooks/rules-of-hooks */
                    usePropertyInjection(
                        state,
                        c.propName as any,
                        useContext(c.context),
                        c.toObservableMode
                    )
                    /* eslint-enable react-hooks/rules-of-hooks */
                }
            }
        }

        let useUpdateEffectsBeforeMount = emptyFunction
        if (state.getBeforeMountEffects) {
            const boundGetBeforeMountEffects = state.getBeforeMountEffects.bind(state)

            useUpdateEffectsBeforeMount = () => {
                useMobxEffects(boundGetBeforeMountEffects, { runBeforeMount: true })
            }
        }

        let useUpdateEffects = emptyFunction
        if (state.getEffects) {
            const boundGetEffects = state.getEffects.bind(state)

            useUpdateEffects = () => {
                useMobxEffects(boundGetEffects, { runBeforeMount: false })
            }
        }

        return { state, useUpdateContexts, useUpdateEffects, useUpdateEffectsBeforeMount }
    }

    const toObservablePropsMode =
        options.toObservablePropsMode === undefined ? "shallow" : options.toObservablePropsMode

    const FuncComponent = (props: any, ref: React.Ref<any>) => {
        const classInstance = useRef<ReturnType<typeof constructFn> | null>(null)
        if (!classInstance.current) {
            classInstance.current = constructFn()
        }
        const instance = classInstance.current!.state

        if (refEmulation) {
            // ok to call conditinally since it won't change for the lifetime of the component
            /* eslint-disable react-hooks/rules-of-hooks */
            useEffect(() => {
                /* eslint-enable react-hooks/rules-of-hooks */

                if (ref) {
                    if (typeof ref === "function") {
                        ref(instance)
                        return () => {
                            ref(null)
                        }
                    } else {
                        ;(ref as any).current = instance
                        return () => {
                            ;(ref as any).current = null
                        }
                    }
                }
                return undefined
            }, [ref, instance])
        }

        const { state, useUpdateContexts, useUpdateEffects, useUpdateEffectsBeforeMount } =
            classInstance.current!

        usePropertyInjection(state, "props", props as any, toObservablePropsMode)
        setOriginalProps(state.props, props)
        ;(state as any).originalProps = props

        useUpdateContexts()

        useUpdateEffectsBeforeMount()
        useUpdateEffects()

        return useMobxObserver(() => {
            return state.render()
        }, displayName)
    }

    FuncComponent.displayName = `${displayName} (mobxComponent)`
    ;(FuncComponent as any).contextTypes = (clazz as any).contextTypes
    // as any to not destroy the types
    ;(FuncComponent as any).propTypes = clazz.propTypes

    const memoComponent = !refEmulation
        ? memo(FuncComponent as any)
        : memo(forwardRef(FuncComponent as any))
    memoComponent.displayName = displayName
    ;(memoComponent as any).defaultProps = clazz.defaultProps
    ;(memoComponent as any).contextTypes = (clazz as any).contextTypes
    ;(memoComponent as any).propTypes = clazz.propTypes
    copyStaticProperties(clazz, memoComponent)

    try {
        Object.defineProperty(memoComponent, Symbol.hasInstance, {
            value: function (instance: any) {
                return instance instanceof clazz
            },
            configurable: true,
        })
    } catch {
        // ignore if not supported in environment
    }

    // When used with TC39 Stage 3 class decorators (@mobxComponent()), the decorator
    // must return a constructor function rather than an object.
    if (context && typeof context === "object" && context.kind === "class") {
        const ResultFunction: any = function (props: any, ref?: any) {
            if (ref !== undefined) {
                return createElement(memoComponent, { ...props, ref })
            }
            return createElement(memoComponent, props)
        }

        ResultFunction.displayName = displayName
        ResultFunction.defaultProps = clazz.defaultProps
        ;(ResultFunction as any).contextTypes = (clazz as any).contextTypes
        ;(ResultFunction as any).propTypes = clazz.propTypes
        copyStaticProperties(clazz, ResultFunction)

        try {
            Object.defineProperty(ResultFunction, Symbol.hasInstance, {
                value: function (instance: any) {
                    return instance instanceof clazz
                },
                configurable: true,
            })
        } catch {
            // ignore if not supported in environment
        }

        return ResultFunction
    }

    return memoComponent
}
