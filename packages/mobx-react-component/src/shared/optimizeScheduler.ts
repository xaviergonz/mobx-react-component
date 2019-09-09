import { configure } from "mobx"

export const optimizeScheduler = (unstable_batchedUpdates: any) => {
    configure({ reactionScheduler: unstable_batchedUpdates })
}
