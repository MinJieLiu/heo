import React from 'react';
import { createContainer, useFunction } from 'heo';

function useCounter() {
  const [count, setCount] = React.useState(0);

  const increment = useFunction(() => {
    setCount((n) => n + 1);
  });

  return {
    count,
    increment,
  };
}

export default createContainer(useCounter);
