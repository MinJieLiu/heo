import React from 'react';
import { createContainer } from 'heo';

function useCounter() {
  const [count, setCount] = React.useState(0);

  return {
    count,
    setCount,
  };
}

export default createContainer(useCounter);
