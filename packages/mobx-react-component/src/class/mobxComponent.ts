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

export abstract class MobxComponent<P extends {} = {}> implements React.Component<P> {
    // just to keep TS happy for the fake implementation of React.Component
    context!: never
    setState!: never
    forceUpdate!: never
    state!: never
    refs!: never

    readonly props!: P
    readonly originalProps!: P

    abstract render(): ReactElement | null

    getEffects?(): MobxEffects
}

export interface IMobxComponentOptions<P> {
    toObservablePropsMode?: ToObservableMode<P>
}

export const mobxComponent = (
    options?: IMobxComponentOptions<any> // TODO: how to get P here?
) => <C extends new () => MobxComponent<any>>(clazz: C): C => {
    return _mobxComponent(clazz as any, options || {}) as any
}

interface IInternalMobxComponent {
    [contextsToInjectSymbol]: IContextToInject[]
}

function _mobxComponent<
    C extends React.ComponentClass<P> & { toObservablePropsMode?: ToObservableMode<P> },
    P
>(clazz: C, options: IMobxComponentOptions<any>) {
    const displayName = clazz.displayName || clazz.name

    const constructFn = () => {
        const state: MobxComponent<any> & IInternalMobxComponent = new clazz(
            undefined as any
        ) as any

        const contexts = state[contextsToInjectSymbol]

        let updateContexts
        if (contexts) {
            updateContexts = () => {
                contexts.forEach(c => {
                    usePropertyInjection(
                        state,
                        c.propName as any,
                        useContext(c.context),
                        c.toObservableMode
                    )
                })
            }
        }

        let updateEffects
        if (state.getEffects) {
            const boundGetEffects = state.getEffects.bind(state)

            updateEffects = () => {
                useMobxEffects(boundGetEffects)
            }
        }

        return { state, updateContexts, updateEffects }
    }

    const toObservablePropsMode =
        options.toObservablePropsMode === undefined ? "shallow" : options.toObservablePropsMode

    const funcComponent = (props: any, ref: React.Ref<any>) => {
            const classInstance = useRef<ReturnType<typeof constructFn> | null>(null)
            if (!classInstance.current) {
                classInstance.current = constructFn()
            }
            const instance = classInstance.current!.state
            useEffect(() => {
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

            const { state, updateContexts, updateEffects } = classInstance.current!

            usePropertyInjection(state, "props", props as any, toObservablePropsMode)
            setOriginalProps(state.props, props)
            ;(state as any).originalProps = props

            if (updateContexts) {
                updateContexts()
            }

            if (updateEffects) {
                updateEffects()
            }

            return useMobxObserver(() => {
                return state.render()
            }, displayName)
        }

        // as any to not destroy the types
    ;(funcComponent as any).propTypes = clazz.propTypes
    funcComponent.displayName = `${displayName} (mobxComponent)`
    funcComponent.contextTypes = clazz.contextTypes

    const forwardRefComponent = forwardRef(funcComponent)
    forwardRefComponent.displayName = `${displayName} (mobxComponent)`
    forwardRefComponent.defaultProps = clazz.defaultProps

    const memoComponent = memo(forwardRefComponent)
    memoComponent.displayName = displayName

    // make sure instanceof clazz keeps working
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
