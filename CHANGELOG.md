# mobx-react-component changelog

## 2.7.3

- Update dependencies.

## 2.7.2

- Update dependencies.

## 2.7.1

- Use `useSyncExternalStore` for better concurrent rendering support.

## 2.7.0

- Use vite for compilation.
- Update for react 18.

## 2.6.1

- Set compilation target to `es5`.

## 2.6.0

- Removed `optimizeScheduler` as it is no longer necessary.

## 2.5.0

- `mobxObserver(memo(() => ...))` is now supported and preferred over `memo(mobxObserver(() => ...))` in order to avoid false errors with rules of hooks in eslint.

## 2.4.0

- Made it compatible with react v17.
- Use FinalizationRegistry rather than a cleanup timer whenever possible.

## 2.3.1

- If observable data changed between mount and useEffect, the render reaction would incorrectly be disposed causing incorrect suspension of upstream computed values

## 2.3.0

- Made changes so it is compatible with MobX 6.
- Renamed `useMobxStaticRendering` to `enableMobxStaticRendering`.

## 2.2.2

- Just updated dev dependencies.

## 2.2.1

- Fixed local state class `getBeforeMountEffects` actually triggering after mount.

## 2.2.0

- Added defaultProps option to mobxObserver.

## 2.1.0

- Improve the type returned by mobxObserver.

## 2.0.5

- Just updated dev dependencies.

## 2.0.4

- Just updated dev dependencies.

## 2.0.3

- Fix for `getBeforeMountEffects` so they actually run before mount.

## 2.0.2

- Small possible fix for React Native fast reloading.

## 2.0.0

- Deprecated `useMobxActions`, `useMobxStore`, `useMobxEffects`, `useMobxAsObservableSource` in favor of `useMobxLocalState`.

## 1.2.0

- Added `optimizeScheduler`. Make sure to read the README.md on how to use it and use it.

## v1.1.1

- Switched to TSDX.

## v1.1.0

- Improved support for strict and concurrent mode.

## v1.0.1

- Fix some typings.

## v1.0.0

- Update some dev dependencies, up version to 1.0.0

## v0.52.0

- Added a `refEmulation` option to `@mobxComponent` to be able to turn ref emulation via forwardRef off.

## v0.51.0

- Fixed SSR warnings about useLayoutEffect
- Fixed props typings of `MobxComponent` not including children by default like class components usually do
- Added `runBeforeMount` option to `useMobxEffects`
- Added `useMobxStatingRendering` and `isUsingMobxStaticRendering`

## v0.50.4

- Some fixes to properly show the component name in the timings section of the performance reports in Chrome for `mobxComponent()` decorated classes
- Added `displayName` option to the option settings of `mobxObserver`
