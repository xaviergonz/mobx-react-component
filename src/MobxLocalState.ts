import { action } from "mobx"
import {
    IToObservablePropsRet,
    toObservableProps,
    ToObservablePropsMode
} from "./toObservableProps"

const EMPTY_ARRAY: any[] = []

export interface IMobxLocalStateOptions<P extends {}> {
    propsMode?: ToObservablePropsMode<P>
}

export abstract class MobxLocalState<Props extends {} = {}> {
    public readonly effects?: () => ReadonlyArray<() => void>

    public get props() {
        return this.obsProps.get()
    }

    private obsProps!: IToObservablePropsRet<Props>
    private lastProps?: Props
    private effectDisposers?: ReadonlyArray<() => void>

    public _instantiate(props: Props, options?: IMobxLocalStateOptions<Props>) {
        this.obsProps = toObservableProps(options && options.propsMode)
        this._updateProps(props)

        if (this.effects) {
            this.effectDisposers = this.effects()
        } else {
            this.effectDisposers = EMPTY_ARRAY
        }
    }

    public _dispose() {
        if (this.effectDisposers) {
            this.effectDisposers.forEach(disposer => disposer())
            this.effectDisposers = undefined
        }
    }

    @action
    public _updateProps(props: Props) {
        if (props === this.lastProps) {
            return
        }
        this.lastProps = props
        this.obsProps.update(props)
    }
}
