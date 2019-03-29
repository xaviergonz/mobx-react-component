import { forwardRef, memo, ReactElement, useContext, ValidationMap, WeakValidationMap } from "react"
import { MobxEffects } from "../shared/MobxEffects"
import { setOriginalProps } from "../shared/originalProps"
import { useLazyInit } from "../shared/useLazyInit"
import { useMobxEffects } from "../shared/useMobxEffects"
import { useMobxObserver } from "../shared/useMobxObserver"
import { ReactManagedAttributes } from "./react-types"
import { usePropertyInjection } from "./usePropertyInjection"

interface IContextToInject {
    context: React.Context<any>
    propName: string
}

const contextsToInject = Symbol("contextsToInject")

export const injectContext = (context: React.Context<any>) => {
    return (target: IMobxComponent, propertyKey: string) => {
        const t = (target as unknown) as IInternalMobxComponent
        // target is the prototype
        let arr = t[contextsToInject]
        if (!arr) {
            arr = []
            t[contextsToInject] = arr
        }
        arr.push({ context, propName: propertyKey })
    }
}

export interface IMobxComponent<P extends object = {}, TRef = {}> {
    props: P

    render(props: P, ref: React.Ref<TRef>): ReactElement | null

    getEffects?(): MobxEffects
}

interface IInternalMobxComponent {
    [contextsToInject]: IContextToInject[]
}

type MobxComponentProps<T extends IMobxComponent<any, any>> = T extends IMobxComponent<infer P, any>
    ? P
    : never
type MobxComponentRef<T extends IMobxComponent<any, any>> = T extends IMobxComponent<any, infer TR>
    ? TR
    : never

export function mobxComponent<
    T extends IMobxComponent<any, any>,
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

    const constructFn = () => {
        const state: IMobxComponent & IInternalMobxComponent = new clazz() as any

        const contexts = state[contextsToInject]

        let updateContexts
        if (contexts) {
            updateContexts = () => {
                contexts.forEach(c => {
                    usePropertyInjection(state, c.propName as any, useContext(c.context), "ref")
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

    // we use this trick to make defaultProps and propTypes behave correctly
    type P2 = ReactManagedAttributes<
        {
            defaultProps: DP
            propTypes: PT
        },
        P
    >

    const funcComponent = (props: P2, ref: React.Ref<R>) => {
            return useMobxObserver(() => {
                const { state, updateContexts, updateEffects } = useLazyInit(constructFn)

                usePropertyInjection(state, "props", props as any, "shallow")
                setOriginalProps(state.props, props)

                if (updateContexts) {
                    updateContexts()
                }

                if (updateEffects) {
                    updateEffects()
                }

                return state.render(state.props, ref)
            }, displayName)
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
