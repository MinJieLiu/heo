import React from 'react';

/**
 * Hook of persistent function
 */
function useFunction<T extends (...args: any[]) => any>(fn: T) {
  const { current } = React.useRef({ fn, result: undefined as T | undefined });
  current.fn = fn;

  if (!current.result) {
    current.result = ((...args) => current.fn.call(null, ...args)) as T;
  }

  return current.result as T;
}

export default useFunction;
