import { observable } from "mobx"
import { updateableObservable } from "./updateableObservable"

export type ObservableWrapperUpdater<T> = (v: T) => void
export type ObservableWrapperGetter<T> = () => T

export interface IObservableWrapper<T> {
    get: ObservableWrapperGetter<T>
    update: ObservableWrapperUpdater<T>
}

export function newObservableWrapper<T>(val: T, mode: "ref" | "shallow"): IObservableWrapper<T> {
    if (mode === "ref") {
        const obs = observable.box(val, { deep: false })
        return {
            get: obs.get.bind(obs),
            update: obs.set.bind(obs)
        }
    } else {
        const obs = updateableObservable(val, "shallow")
        return {
            get: obs.get.bind(obs),
            update: obs.update.bind(obs)
        }
    }
}
