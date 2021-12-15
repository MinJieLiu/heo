import React from 'react';

export type SelectorFn<Value, Selected> = (value: Value) => Selected;

export interface ContainerProviderProps<State = void, Value = void> {
  initialState?: State;
  children?: React.ReactNode | ((value: Value) => React.ReactNode);
}

interface KeepValue<Value> {
  value: Value;
  listeners: Set<(value: Value) => void>;
}

const isSSR =
  typeof window === 'undefined' || /ServerSideRendering/.test(window.navigator && window.navigator.userAgent);

const useIsomorphicLayoutEffect = isSSR ? React.useEffect : React.useLayoutEffect;

/**
 * Create a container with `useHook`
 */
export function createContainer<Value, State = void>(useHook: (initialState?: State) => Value) {
  // Keep the Context never triggering an update
  const Context = React.createContext<KeepValue<Value> | null>(null);

  const Provider = React.memo(({ initialState, children }: ContainerProviderProps<State, Value>) => {
    const value = useHook(initialState);
    const keepValue = React.useRef<KeepValue<Value>>({ value, listeners: new Set() }).current;
    keepValue.value = value;

    if (process.env.NODE_ENV !== 'production') {
      useIsomorphicLayoutEffect(() => {
        keepValue.listeners.forEach((listener) => {
          listener(value);
        });
      });
    } else {
      keepValue.listeners.forEach((listener) => {
        listener(value);
      });
    }

    return (
      <Context.Provider value={keepValue}>
        {typeof children === 'function' ? children(value) : children}
      </Context.Provider>
    );
  });

  function useSelector<Selected>(selector: SelectorFn<Value, Selected>): Selected {
    const [, forceUpdate] = React.useReducer((c) => c + 1, 0);
    const forwardValue = React.useContext(Context);
    if (forwardValue === null) {
      throw new Error('The component must be wrapped by <Container.Provider />');
    }
    const { value, listeners } = forwardValue;
    const selected = selector(value);

    const storeValue = {
      selector,
      value,
      selected,
    };
    const ref = React.useRef(storeValue);
    ref.current = storeValue;

    useIsomorphicLayoutEffect(() => {
      // Trigger update conditions, the same will prevent render
      function callback(nextValue: Value) {
        try {
          if (!ref.current) {
            return;
          }
          const refValue = ref.current;
          if (refValue.value === nextValue) {
            return;
          }
          const nextSelected = refValue.selector(nextValue);
          if (isShadowEqual(refValue.selected, nextSelected)) {
            return;
          }
        } catch (e) {
          // ignore
        }
        forceUpdate();
      }
      listeners.add(callback);
      return () => {
        listeners.delete(callback);
      };
    }, []);
    return selected;
  }

  function usePicker<Selected extends keyof Value>(selected: Selected[]): Pick<Value, Selected> {
    return useSelector((state) => pick(state as Required<Value>, selected));
  }

  function withPicker<T, Selected extends keyof Value>(
    Child: React.FC<T & Pick<Value, Selected>>,
    selected: Selected[],
  ): React.FC<Omit<T, Selected>> {
    return (props) => {
      const picked = usePicker(selected);
      return <Child {...picked} {...(props as T)} />;
    };
  }

  function withProvider<T>(Child: React.FC<T>, initialState?: State): React.FC<T> {
    return (props) => (
      <Provider initialState={initialState}>
        <Child {...props} />
      </Provider>
    );
  }

  return {
    Context,
    Provider,
    /**
     * Filter the required return value through the hook.
     * @param selector
     * @example
     * const count = useSelector(state => state.count)
     */
    useSelector,
    /**
     * Filter the required values in the array, provided that `state` must be `object`.
     * @param selected
     * @example
     * const { count, setCount } = usePicker(['count', 'setCount'])
     */
    usePicker,
    /**
     * High-level component picker
     * @param Child
     * @param selected
     */
    withPicker,
    /**
     * Provider wrapper.
     * @param Child
     */
    withProvider,
  };
}

function pick<T extends object, U extends keyof T>(origin: T, keys: U[]): Pick<T, U> {
  const empty = {} as Pick<T, U>;
  if (!origin) {
    return empty;
  }
  return Object.assign(empty, ...keys.map((key) => ({ [key]: origin[key] })));
}

/**
 * Shadow equal
 * @param origin
 * @param next
 */
function isShadowEqual(origin: unknown, next: unknown) {
  if (Object.is(origin, next)) {
    return true;
  }
  if (origin && typeof origin === 'object' && next && typeof next === 'object') {
    if (
      [...Object.keys(origin), ...Object.keys(next)].every(
        (k) => origin[k] === next[k] && origin.hasOwnProperty(k) && next.hasOwnProperty(k),
      )
    ) {
      return true;
    }
  }
  return false;
}

export { isShadowEqual };

export { default as useFunction } from './useFunction';
export { default as useMethods } from './useMethods';
