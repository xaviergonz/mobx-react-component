import { action } from "mobx"
import * as React from "react"
import { MobxEffects } from "../shared/MobxEffects"
import { IObservableWrapper, newObservableWrapper } from "../shared/observableWrapper"
import { UpdateableObservableMode } from "../shared/updateableObservable"
import { useMobxEffects } from "../shared/useMobxEffects"
import { withoutForceUpdate } from "../shared/useMobxObserver"

const updateStateSymbol = Symbol("updateState")
const updateProxiesSymbol = Symbol("updateProxies")
const propsSymbol = Symbol("props")
const initSymbol = Symbol("init")

class MobxLocalStateBase<Props extends object = {}> {
    private [propsSymbol]!: IObservableWrapper<Readonly<Props>>

    get props(): Props {
        const props = this[propsSymbol]
        if (!props) {
            throw fail("props are not available in the constructor")
        }

        return props.get()
    }

    getEffects?(): MobxEffects
    getBeforeMountEffects?(): MobxEffects

    onInit?(): void

    [updateProxiesSymbol](props: Props) {
        proxyPropNames(this, Object.getOwnPropertyNames(props), "props")
    }

    [initSymbol](props: Props, mode: UpdateableObservableMode<Props>) {
        this[propsSymbol] = newObservableWrapper(props, mode)

        this[updateProxiesSymbol](props)

        if (this.getEffects) {
            this.getEffects = this.getEffects.bind(this)
        }
        if (this.getBeforeMountEffects) {
            this.getBeforeMountEffects = this.getBeforeMountEffects.bind(this)
        }
    }

    [updateStateSymbol] = withoutForceUpdate(
        action((props: Props) => {
            this[propsSymbol].update(props)

            // proxy new properties (if any)
            this[updateProxiesSymbol](props)
        })
    )
}

function proxyPropName(target: any, propName: string, member: string | symbol) {
    if (!(propName in target)) {
        Object.defineProperty(target, propName, {
            enumerable: true,
            configurable: true,
            get(this: any) {
                return this[member][propName]
            },
        })
    }
}

function proxyPropNames(target: any, propNames: string[], member: string | symbol) {
    const len = propNames.length
    for (let i = 0; i < len; i++) {
        proxyPropName(target, propNames[i], member)
    }
}

export type MobxLocalState<Props extends object = {}> = {
    new (): Props & {
        readonly props: Readonly<Props>

        getEffects?(): MobxEffects
        getBeforeMountEffects?(): MobxEffects

        onInit?(): void
    }
}

export type MobxLocalStateProps<MLC> = MLC extends MobxLocalState<infer P> ? P : never

// eslint-disable-next-line @typescript-eslint/no-redeclare
export function MobxLocalState<Props extends object = {}>(): MobxLocalState<Props> {
    return MobxLocalStateBase as any
}

/**
 * Uses a MobxLocalState extended class instance as local state for a component.
 *
 * Example:
 * ```ts
 * interface CompProps {
 *   x: number
 * }
 *
 * class CompState extends MobxLocalState<CompProps & { y: number}>() {
 *   @observable
 *   z: number = 10
 *
 *   @computed
 *   get sum() {
 *     // sum x from dependencies, y from dependencies and z from local observable
 *     return this.x + this.y + this.z
 *     // alternative syntax
 *     return this.props.x + this.props.y + this.z
 *   }
 *
 *   @action
 *   incZ = () => {
 *     this.z++
 *   }
 *
 *   onInit() {
 *     // any optional initialization code you might need
 *   }
 *
 *   getEffects() {
 *     // these will be after first render (kind of like at componentDidMount)
 *     return [
 *       when(() => this.sum === 10, () => {
 *         alert("sum reached 10")
 *       })
 *     ]
 *   }
 *
 *   getBeforeMountEffects() {
 *     // these will be after before render (kind of like at componentWillMount)
 *     return [
 *       when(() => this.sum === 10, () => {
 *         alert("sum reached 10")
 *       })
 *     ]
 *   }
 * }
 *
 * const Comp = React.memo(mobxObserver((props: CompProps) => {
 *   const [ y, setY ] = React.useState(5)
 *   const state = useMobxLocalState(CompState, { ...props, y })
 *
 *   return <span>sum is {state.sum}</span>
 * }))
 *
 * ```
 *
 */
export function useMobxLocalState<MLC extends MobxLocalState>(
    stateClass: MLC,
    props: MobxLocalStateProps<MLC>,
    mode: UpdateableObservableMode<MobxLocalStateProps<MLC>> = "shallow"
): InstanceType<MLC> {
    const stateRef = React.useRef<MobxLocalStateBase | null>(null)

    if (!stateRef.current) {
        withoutForceUpdate(
            action(() => {
                stateRef.current = new (stateClass as any)()
                stateRef.current![initSymbol](props, mode)
                if (stateRef.current!.onInit) {
                    stateRef.current!.onInit()
                }
            })
        )()
    } else {
        stateRef.current[updateStateSymbol](props)
    }

    if (stateRef.current!.getBeforeMountEffects) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useMobxEffects(stateRef.current!.getBeforeMountEffects, { runBeforeMount: true })
    }

    if (stateRef.current!.getEffects) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useMobxEffects(stateRef.current!.getEffects, { runBeforeMount: false })
    }

    return stateRef.current as any
}
