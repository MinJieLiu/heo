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
import type { KeepValue, SelectorFn, StoreProviderProps } from './types';

const batchedUpdates = ReactDOM.unstable_batchedUpdates || ((fn: () => void) => fn());

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * Create a store with `useHook`
 */
export function createStore<Value extends object, State = void>(
  useHook: (initialState?: State) => Value,
) {
  // Keep the Context never triggering an update
  const Context = createContext<KeepValue<Value> | null>(null);

  // eslint-disable-next-line react/display-name
  const Provider = memo(({ initialState, children }: StoreProviderProps<State, Value>) => {
    const value = useHook(initialState);
    const keepValue = useRef<KeepValue<Value>>({ value, listeners: new Set() }).current;
    keepValue.value = value;

    useIsomorphicLayoutEffect(() => {
      batchedUpdates(() => keepValue.listeners.forEach((listener) => listener(value)));
    });

    return (
      <Context.Provider value={keepValue}>
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

  function useStoreUpdate(keepValue: KeepValue<Value>, equalityFn: (nextValue: Value) => boolean) {
    const subscribe = useCallback((update: () => void) => {
      const { listeners } = keepValue;
      function listener(nextValue: Value) {
        if (!equalityFn(nextValue)) {
          update();
        }
      }
      listeners.add(listener);
      return () => listeners.delete(listener);
    }, []);

    const getSnapshot = useCallback(() => keepValue.value, []);
    useSyncExternalStore(subscribe, getSnapshot);
  }

  function useSelector<Selected>(selector: SelectorFn<Value, Selected>): Selected {
    const keepValue = useContextValue();
    const storeValue = {
      selector,
      value: keepValue.value,
      selected: selector(keepValue.value),
    };
    const ref = useRef(storeValue);
    ref.current = storeValue;

    useStoreUpdate(keepValue, (nextValue) => {
      const refValue = ref.current;
      if (refValue.value === nextValue) {
        return true;
      }
      return shallow(refValue.selected, refValue.selector(nextValue));
    });
    return storeValue.selected;
  }

  function usePicker(): Value {
    const keepValue = useContextValue();

    const proxy = useRef<Value>();
    const canUpdate = useRef(false);
    const updated = useRef(false);

    useMemo(() => {
      const handler: ProxyHandler<Value> = {
        get(target, key) {
          if (keepValue.value.hasOwnProperty(key)) {
            canUpdate.current = true;
            // eslint-disable-next-line no-param-reassign
            target[key] = keepValue.value[key];
            return target[key];
          }
          return undefined;
        },
        set(target, key, val) {
          if (key in target && val !== target[key]) {
            updated.current = true;
            // eslint-disable-next-line no-param-reassign
            target[key] = val;
          }
          return true;
        },
      };

      proxy.current = new Proxy({} as Value, handler);
    }, []);

    useStoreUpdate(keepValue, (nextValue) => {
      if (!canUpdate.current) return true;
      // Trigger update
      Object.assign(proxy.current as Value, nextValue);
      if (updated.current) {
        updated.current = false;
        return false;
      }
      return true;
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
