// tslint:disable

import * as PropTypes from "prop-types"

// we copy these types from react typedefs since they are not public

// naked 'any' type in a conditional type will short circuit and union both the then/else branches
// so boolean is only resolved for T = any
type IsExactlyAny<T> = boolean extends (T extends never ? true : false) ? true : false

// Try to resolve ill-defined props like for JS users: props can be any, or sometimes objects with properties of type any
// If props is type any, use propTypes definitions, otherwise for each `any` property of props, use the propTypes type
// If declared props have indexed properties, ignore inferred props entirely as keyof gets widened
type MergePropTypes<P, T> = IsExactlyAny<P> extends true
    ? T
    : ({
          [K in keyof P]: IsExactlyAny<P[K]> extends true ? (K extends keyof T ? T[K] : P[K]) : P[K]
      } &
          Pick<T, Exclude<keyof T, keyof P>>)

// Any prop that has a default prop becomes optional, but its type is unchanged
// Undeclared default props are augmented into the resulting allowable attributes
// If declared props have indexed properties, ignore default props entirely as keyof gets widened
// Wrap in an outer-level conditional type to allow distribution over props that are unions
type Defaultize<P, D> = P extends any
    ? string extends keyof P
        ? P
        : Pick<P, Exclude<keyof P, keyof D>> &
              Partial<Pick<P, Extract<keyof P, keyof D>>> &
              Partial<Pick<D, Exclude<keyof D, keyof P>>>
    : never

export type ReactManagedAttributes<C, P> = C extends { propTypes: infer T; defaultProps: infer D }
    ? Defaultize<MergePropTypes<P, PropTypes.InferProps<T>>, D>
    : C extends { propTypes: infer T }
    ? MergePropTypes<P, PropTypes.InferProps<T>>
    : C extends { defaultProps: infer D }
    ? Defaultize<P, D>
    : P
