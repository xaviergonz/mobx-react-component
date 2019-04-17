import { observable } from "mobx"
import { updateableObservable, UpdateableObservableMode } from "./updateableObservable"

export type ObservableWrapperUpdater<T> = (v: T) => void
export type ObservableWrapperGetter<T> = () => T

export interface IObservableWrapper<T> {
    get: ObservableWrapperGetter<T>
    update: ObservableWrapperUpdater<T>
}

export type ToObservableModeWithoutRef<T> = UpdateableObservableMode<T>
export type ToObservableMode<T> = "ref" | UpdateableObservableMode<T>

export function newObservableWrapper<T>(val: T, mode: ToObservableMode<T>): IObservableWrapper<T> {
    if (mode === "ref") {
        const obs = observable.box(val, { deep: false })
        return {
            get: obs.get.bind(obs),
            update: obs.set.bind(obs)
        }
    } else {
        const obs = updateableObservable(val, mode)
        return {
            get: obs.get.bind(obs),
            update: obs.update.bind(obs)
        }
    }
}
