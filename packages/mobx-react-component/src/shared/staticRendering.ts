let globalIsUsingStaticRendering = false

export function useMobxStaticRendering(enable: boolean) {
    globalIsUsingStaticRendering = enable
}

export function isUsingMobxStaticRendering(): boolean {
    return globalIsUsingStaticRendering
}
