import {
    forwardRef,
    memo,
    ReactElement,
    useContext,
    useRef,
    ValidationMap,
    WeakValidationMap
} from "react"
import { MobxEffects } from "../shared/MobxEffects"
import { setOriginalProps } from "../shared/originalProps"
import { useMobxEffects } from "../shared/useMobxEffects"
import { useMobxObserver } from "../shared/useMobxObserver"
import { ReactManagedAttributes } from "./react-types"
import { usePropertyInjection } from "./usePropertyInjection"

interface IContextToInject {
    context: React.Context<any>
    propName: string
}

const contextsToInjectSymbol = Symbol("contextsToInject")

export function injectContext(context: React.Context<any>) {
    return (targetComponent: MobxComponent, propertyKey: string) => {
        // target is the prototype
        const prototype = (targetComponent as unknown) as IInternalMobxComponent
        let contextsToInject = prototype[contextsToInjectSymbol]
        if (!contextsToInject) {
            contextsToInject = []
            prototype[contextsToInjectSymbol] = contextsToInject
        }
        contextsToInject.push({ context, propName: propertyKey })
    }
}

export abstract class MobxComponent<P extends object = {}, TRef = {}> {
    readonly props!: P
    readonly originalProps!: P
    readonly ref!: React.Ref<TRef>

    abstract render(): ReactElement | null

    getEffects?(): MobxEffects
}

interface IInternalMobxComponent {
    [contextsToInjectSymbol]: IContextToInject[]
}

type MobxComponentProps<T extends MobxComponent<any, any>> = T extends MobxComponent<infer P, any>
    ? P
    : never
type MobxComponentRef<T extends MobxComponent<any, any>> = T extends MobxComponent<any, infer TR>
    ? TR
    : never

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

    const constructFn = () => {
        const state: MobxComponent<any, any> & IInternalMobxComponent = new clazz() as any

        const contexts = state[contextsToInjectSymbol]

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
                const classInstance = useRef<ReturnType<typeof constructFn> | null>(null)
                if (!classInstance.current) {
                    classInstance.current = constructFn()
                }
                const { state, updateContexts, updateEffects } = classInstance.current!

                usePropertyInjection(state, "props", props as any, "shallow")
                setOriginalProps(state.props, props)
                ;(state as any).originalProps = props
                ;(state as any).ref = ref

                if (updateContexts) {
                    updateContexts()
                }

                if (updateEffects) {
                    updateEffects()
                }

                return state.render()
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
