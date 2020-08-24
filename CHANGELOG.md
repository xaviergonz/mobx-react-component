# mobx-react-component changelog

## 2.2.2

-   Just updated dev dependencies.

## 2.2.1

-   Fixed local state class `getBeforeMountEffects` actually triggering after mount.

## 2.2.0

-   Added defaultProps option to mobxObserver.

## 2.1.0

-   Improve the type returned by mobxObserver.

## 2.0.5

-   Just updated dev dependencies.

## 2.0.4

-   Just updated dev dependencies.

## 2.0.3

-   Fix for `getBeforeMountEffects` so they actually run before mount.

## 2.0.2

-   Small possible fix for React Native fast reloading.

## 2.0.0

-   Deprecated `useMobxActions`, `useMobxStore`, `useMobxEffects`, `useMobxAsObservableSource` in favor of `useMobxLocalState`.

## 1.2.0

-   Added `optimizeScheduler`. Make sure to read the README.md on how to use it and use it.

## v1.1.1

-   Switched to TSDX.

## v1.1.0

-   Improved support for strict and concurrent mode.

## v1.0.1

-   Fix some typings.

## v1.0.0

-   Update some dev dependencies, up version to 1.0.0

## v0.52.0

-   Added a `refEmulation` option to `@mobxComponent` to be able to turn ref emulation via forwardRef off.

## v0.51.0

-   Fixed SSR warnings about useLayoutEffect
-   Fixed props typings of `MobxComponent` not including children by default like class components usually do
-   Added `runBeforeMount` option to `useMobxEffects`
-   Added `useMobxStatingRendering` and `isUsingMobxStaticRendering`

## v0.50.4

-   Some fixes to properly show the component name in the timings section of the performance reports in Chrome for `mobxComponent()` decorated classes
-   Added `displayName` option to the option settings of `mobxObserver`
