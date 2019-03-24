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
