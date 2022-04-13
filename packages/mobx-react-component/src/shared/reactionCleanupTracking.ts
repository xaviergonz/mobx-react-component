import { createReactionCleanupTrackingUsingFinalizationRegistry } from "./createReactionCleanupTrackingUsingFinalizationRegistry"
import { createTimerBasedReactionCleanupTracking } from "./createTimerBasedReactionCleanupTracking"
import { FinalizationRegistry as FinalizationRegistryMaybeUndefined } from "./FinalizationRegistryWrapper"

const {
    addReactionToTrack,
    recordReactionAsCommitted,
    resetCleanupScheduleForTests,
    forceCleanupTimerToRunNowForTests,
} = FinalizationRegistryMaybeUndefined
    ? createReactionCleanupTrackingUsingFinalizationRegistry(FinalizationRegistryMaybeUndefined)
    : createTimerBasedReactionCleanupTracking()

export type { IReactionTracking } from "./reactionCleanupTrackingCommon"
export {
    addReactionToTrack,
    recordReactionAsCommitted,
    resetCleanupScheduleForTests,
    forceCleanupTimerToRunNowForTests,
}
