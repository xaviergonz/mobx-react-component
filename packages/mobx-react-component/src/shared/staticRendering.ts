let globalIsUsingStaticRendering = false

export function enableMobxStaticRendering(enable: boolean) {
    globalIsUsingStaticRendering = enable
}

export function isUsingMobxStaticRendering(): boolean {
    return globalIsUsingStaticRendering
}
