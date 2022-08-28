import type React from 'react';

export type SelectorFn<Value, Selected> = (value: Value) => Selected;

export interface StoreProviderProps<State = void, Value = void> {
  initialState?: State;
  children?: React.ReactNode | ((value: Value) => React.ReactNode);
}

export interface KeepValue<Value> {
  value: Value;
  listeners: Set<(value: Value) => void>;
}
