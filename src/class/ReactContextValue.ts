export type ReactContextValue<T extends React.Context<any>> = T extends React.Context<infer V>
    ? V
    : never
