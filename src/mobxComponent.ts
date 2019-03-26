import { IUseObserverOptions, useObserver } from "mobx-react-lite"
import {
    forwardRef,
    memo,
    ReactElement,
    useContext,
    useState,
    ValidationMap,
    WeakValidationMap
} from "react"
import { ReactManagedAttributes } from "./react-types"
import { useEffectMethods } from "./useEffectMethods"
import { usePropertyInjection } from "./usePropertyInjection"
import { useForceUpdate } from "./utils"

function injectedProperty<T>(): T {
    return (undefined as any) as T
}

interface IContextToInject {
    context: React.Context<any>
    propName: string
}

const contextsToInject = Symbol("contextsToInject")

export type ContextValue<T extends React.Context<any>> = T extends React.Context<infer V>
    ? V
    : never

export const injectContext = (context: React.Context<any>) => {
    return (target: MobxComponent<any, any>, propertyKey: string) => {
        // target is the prototype
        let arr = target[contextsToInject]
        if (!arr) {
            arr = []
            target[contextsToInject] = arr
        }
        arr.push({ context, propName: propertyKey })
    }
}

export abstract class MobxComponent<P extends object = {}, TRef = {}> {
    props = injectedProperty<P>()

    abstract render(props: P, ref: React.Ref<TRef>): ReactElement | null

    private [contextsToInject]: IContextToInject[]
}

type MobxComponentProps<T extends MobxComponent<any>> = T extends MobxComponent<infer P> ? P : never
type MobxComponentRef<T extends MobxComponent<any>> = T extends MobxComponent<any, infer TR>
    ? TR
    : never

const useObserverOptions: IUseObserverOptions = {
    useForceUpdate
}

export function mobxComponent<
    T extends MobxComponent<any, any>,
    P extends MobxComponentProps<T>,
    R extends MobxComponentRef<T>,
    DP extends Partial<P>,
    PT extends WeakValidationMap<P>,
    CT extends ValidationMap<any>
>(
    clazz: new () => T,
    statics?: {
        propTypes?: PT
        contextTypes?: CT
        defaultProps?: DP
        displayName?: string
    }
) {
    const displayName = (statics && statics.displayName) || clazz.name

    const constructFn = () => new clazz()

    // we use this trick to make defaultProps and propTypes behave correctly
    type P2 = ReactManagedAttributes<
        {
            defaultProps: DP
            propTypes: PT
        },
        P
    >

    const funcComponent = (props: P2, ref: React.Ref<R>) => {
            const [state] = useState(constructFn)

            usePropertyInjection(state, "props", props as any)

            const contexts = state[contextsToInject]
            if (contexts) {
                contexts.forEach(c => {
                    const contextValue = useContext(c.context)
                    usePropertyInjection(state, c.propName as any, contextValue)
                })
            }

            useEffectMethods(state)

            return useObserver(
                () => {
                    return state.render(state.props, ref)
                },
                displayName,
                useObserverOptions
            )
        }

        // as any to not destroy the types
    ;(funcComponent as any).propTypes = statics && statics.propTypes
    funcComponent.contextTypes = statics && statics.contextTypes

    const forwardRefComponent = forwardRef(funcComponent)
    forwardRefComponent.defaultProps = statics && statics.defaultProps

    const memoComponent = memo(forwardRefComponent)
    memoComponent.displayName = displayName

    return memoComponent
}
