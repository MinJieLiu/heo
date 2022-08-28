import { useCallback, useState } from 'react';
import { createStore } from 'heo/src';

function useCounter() {
  const [count, setCount] = useState(0);
  const [count1, setCount2] = useState(0);

  const increment = useCallback(() => {
    setCount((n) => n + 1);
  }, []);

  return {
    count,
    increment,
    count1,
    setCount2,
  };
}

export default createStore(useCounter);
