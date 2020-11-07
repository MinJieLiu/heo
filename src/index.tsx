import React from 'react';

export type SelectorFn<Value, Selected> = (value: Value) => Selected;

export interface ContainerProviderProps<State = void> {
  initialState?: State;
}

/**
 * Create a container with `useHook`
 */
export function createContainer<Value, State = void>(useHook: (initialState?: State) => Value) {
  // Keep the Context never triggering an update
  // @ts-ignore
  const Context = React.createContext<Value | null>(null, () => 0);
  const ListenerContext = React.createContext<Set<(value: Value) => void>>(new Set());

  const Provider: React.FC<ContainerProviderProps<State>> = React.memo(
    ({ initialState, children }) => {
      const value = useHook(initialState);
      const listeners = React.useRef<Set<(listener: Value) => void>>(new Set()).current;

      if (process.env.NODE_ENV !== 'production') {
        // prevent warning
        React.useLayoutEffect(() => {
          listeners.forEach((listener) => {
            listener(value);
          });
        });
      } else {
        listeners.forEach((listener) => {
          listener(value);
        });
      }
      return (
        <Context.Provider value={value}>
          <ListenerContext.Provider value={listeners}>{children}</ListenerContext.Provider>
        </Context.Provider>
      );
    },
  );

  function useSelector<Selected>(selector: SelectorFn<Value, Selected>): Selected {
    const [, forceUpdate] = React.useReducer((c) => c + 1, 0);
    const value = React.useContext(Context);
    const listeners = React.useContext(ListenerContext);
    if (value === null) {
      throw new Error('The component must be wrapped by <Container.Provider />');
    }
    const selected = selector(value);
    // Last
    const ref = React.useRef<{
      selector: SelectorFn<Value, Selected>;
      value: Value;
      selected: Selected;
    } | null>(null);

    React.useLayoutEffect(() => {
      ref.current = {
        selector,
        value,
        selected,
      };
    });

    React.useLayoutEffect(() => {
      // Trigger update conditions, the same will prevent render
      const callback = (nextValue: Value) => {
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
      };
      listeners.add(callback);
      return () => {
        listeners.delete(callback);
      };
    }, []);
    return selected;
  }

  function usePicker<S extends keyof Value>(selected: S[]): Pick<Value, S> {
    return useSelector((state) => pick(state as Required<Value>, selected));
  }

  function withProvider<T>(OriginComponent: React.FC<T>): React.FC<T> {
    return (props) => (
      <Provider>
        <OriginComponent {...props} />
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
     * Provider wrapper.
     * @param OriginComponent
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
