import type { ReactNode } from 'react';

export type SelectorFn<Value, Selected> = (value: Value) => Selected;

export interface StoreProviderProps<State = void, Value = void> {
  initialState?: State;
  children?: ReactNode | ((value: Value) => ReactNode);
}

export interface StoreBridge<Value> {
  value: Value;
  listeners: Set<(value: Value) => void>;
}
