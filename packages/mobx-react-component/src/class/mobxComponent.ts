import { forwardRef, memo, ReactElement, useContext, useEffect, useRef } from "react"
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
    return (targetComponent: MobxComponent, propertyKey: string) => {
        // target is the prototype
        const prototype = (targetComponent as unknown) as IInternalMobxComponent
        let contextsToInject = prototype[contextsToInjectSymbol]
        if (!contextsToInject) {
            contextsToInject = []
            prototype[contextsToInjectSymbol] = contextsToInject
        }
        contextsToInject.push({ context, propName: propertyKey, toObservableMode })
    }
}

// we use PropsWithChildren for typing compatibility with class components
export abstract class MobxComponent<P extends {} = {}>
    implements React.Component<React.PropsWithChildren<P>> {
    // just to keep TS happy for the fake implementation of React.Component
    context!: never
    setState!: never
    forceUpdate!: never
    state!: never
    refs!: never

    readonly props!: React.PropsWithChildren<P>
    readonly originalProps!: React.PropsWithChildren<P>

    abstract render(): ReactElement | null

    getEffects?(): MobxEffects
}

export interface IMobxComponentOptions<P> {
    toObservablePropsMode?: ToObservableMode<P>
    refEmulation?: boolean
}

export const mobxComponent = (
    options?: IMobxComponentOptions<any> // TODO: how to get P here?
) => <C extends new () => MobxComponent<any>>(clazz: C): C => {
    return _mobxComponent(clazz as any, options || {}) as any
}

interface IInternalMobxComponent {
    [contextsToInjectSymbol]: IContextToInject[]
}

const emptyFunction = () => {}

function _mobxComponent<C extends React.ComponentClass<P>, P>(
    clazz: C,
    options: IMobxComponentOptions<any>
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

        let useUpdateEffects = emptyFunction
        if (state.getEffects) {
            const boundGetEffects = state.getEffects.bind(state)

            useUpdateEffects = () => {
                useMobxEffects(boundGetEffects)
            }
        }

        return { state, useUpdateContexts, useUpdateEffects }
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

        const { state, useUpdateContexts, useUpdateEffects } = classInstance.current!

        usePropertyInjection(state, "props", props as any, toObservablePropsMode)
        setOriginalProps(state.props, props)
        ;(state as any).originalProps = props

        useUpdateContexts()

        useUpdateEffects()

        return useMobxObserver(() => {
            return state.render()
        }, displayName)
    }

    FuncComponent.displayName = `${displayName} (mobxComponent)`
    FuncComponent.contextTypes = clazz.contextTypes
    // as any to not destroy the types
    ;(FuncComponent as any).propTypes = clazz.propTypes

    if (!refEmulation) {
        FuncComponent.defaultProps = clazz.defaultProps

        const memoComponent = memo(FuncComponent)
        memoComponent.displayName = displayName

        return memoComponent
    } else {
        const forwardRefComponent = forwardRef(FuncComponent)
        forwardRefComponent.displayName = `${displayName} (mobxComponent)`
        ;(forwardRefComponent as any).defaultProps = clazz.defaultProps

        const memoComponent = memo(forwardRefComponent)
        memoComponent.displayName = displayName

        // make sure instanceof clazz keeps working for refs
        const originalHasInstance = memoComponent[Symbol.hasInstance]
        memoComponent[Symbol.hasInstance] = function(this: any, instance) {
            if (originalHasInstance) {
                const result = originalHasInstance.apply(memoComponent, arguments as any)
                if (result) {
                    return true
                }
            }

            return instance instanceof clazz
        }

        return memoComponent
    }
}
