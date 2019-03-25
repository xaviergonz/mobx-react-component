import { UpdateableObservableMode } from "./updateableObservable"

export function injectedProperty<T>(mode: UpdateableObservableMode<T> = "shallow"): T {
    return (mode as any) as T
}
