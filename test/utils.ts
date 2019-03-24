export function productionMode(fn: () => void) {
    const oldNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = "production"

    try {
        fn()
    } finally {
        process.env.NODE_ENV = oldNodeEnv
    }
}

export function changesList(): [string[], (newChanges: string[]) => void] {
    const changes: string[] = []
    function expectChangesToBe(newChanges: string[]) {
        try {
            expect(changes).toEqual(newChanges)
        } finally {
            changes.length = 0
        }
    }
    return [changes, expectChangesToBe]
}
