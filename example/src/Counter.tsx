import React from 'react';
import CounterContainer from './CounterContainer';
import styles from './Counter.module.css';

const Counter = () => {
  const { count, setCount } = CounterContainer.usePicker(['count', 'setCount']);

  function increment() {
    setCount((n) => n + 1);
  }

  return (
    <div className={styles.counter}>
      <span>current: </span>
      {count}
      <button type="button" onClick={increment}>
        ADD
      </button>
    </div>
  );
};

export default Counter;
