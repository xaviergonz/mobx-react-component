const originalProps = new WeakMap<any, any>()

export function getOriginalProps<P extends object>(obsProps: P): P {
    return originalProps.get(obsProps)
}

export function setOriginalProps<P extends object>(obsProps: P, props: P) {
    originalProps.set(obsProps, props)
}
