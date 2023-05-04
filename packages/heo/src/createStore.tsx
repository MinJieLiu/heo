/* eslint-disable no-param-reassign,react/display-name */
import React, {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';
import ReactDOM from 'react-dom';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { shallow } from './shallow';
import type { StoreBridge, SelectorFn, StoreProviderProps } from './types';

const batchedUpdates = ReactDOM.unstable_batchedUpdates || ((fn: () => void) => fn());

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * Create a store with `useHook`
 */
export function createStore<Value extends object, State = void>(
  useHook: (initialState?: State) => Value,
) {
  // Keep the Context never triggering an update
  const Context = createContext<StoreBridge<Value> | null>(null);

  const Provider = memo(({ initialState, children }: StoreProviderProps<State, Value>) => {
    const value = useHook(initialState);
    const bridge = useRef<StoreBridge<Value>>({ value, listeners: new Set() }).current;
    bridge.value = value;

    useIsomorphicLayoutEffect(() =>
      batchedUpdates(() => bridge.listeners.forEach((listener) => listener(value))),
    );

    return (
      <Context.Provider value={bridge}>
        {typeof children === 'function' ? children(value) : children}
      </Context.Provider>
    );
  });

  function useContextValue() {
    const value = useContext(Context);
    if (value === null) {
      throw new Error('The component must be wrapped by <Store.Provider />');
    }
    return value;
  }

  function useStoreUpdate(bridge: StoreBridge<Value>, equalityFn: (nextValue: Value) => boolean) {
    const fnRef = useRef(equalityFn);
    fnRef.current = equalityFn;

    const subscribe = useCallback((update: () => void) => {
      const { listeners } = bridge;
      function listener(nextValue: Value) {
        if (!fnRef.current(nextValue)) {
          update();
        }
      }
      listeners.add(listener);
      return () => listeners.delete(listener);
    }, []);

    const getSnapshot = useCallback(() => bridge.value, []);
    useSyncExternalStore(subscribe, getSnapshot);
  }

  function useSelector<Selected>(selector: SelectorFn<Value, Selected>): Selected {
    const bridge = useContextValue();
    const selected = selector(bridge.value);

    useStoreUpdate(bridge, (nextValue) => shallow(selected, selector(nextValue)));
    return selected;
  }

  function usePicker(): Value {
    const bridge = useContextValue();

    const proxy = useRef<Value>();
    const canUpdate = useRef(false);
    const updated = useRef(false);

    useMemo(() => {
      const handler: ProxyHandler<Value> = {
        get(target, key) {
          canUpdate.current = true;
          target[key] = bridge.value[key];
          return target[key];
        },
        set(target, key, val) {
          if (key in target && val !== target[key]) {
            updated.current = true;
            target[key] = val;
          }
          return true;
        },
      };

      proxy.current = new Proxy({} as Value, handler);
    }, []);

    useStoreUpdate(bridge, (nextValue) => {
      if (!canUpdate.current) return true;
      // Trigger update
      Object.assign(proxy.current as Value, nextValue);
      const result = !updated.current;
      updated.current = false;

      return result;
    });
    return proxy.current as Value;
  }

  function withProvider<T extends object>(
    Children: React.FC<T>,
    initialState?: State,
  ): React.FC<T> {
    return function ProviderComponent(props) {
      return (
        <Provider initialState={initialState}>
          <Children {...props} />
        </Provider>
      );
    };
  }

  return {
    Context,
    Provider,
    useSelector,
    usePicker,
    withProvider,
  };
}
