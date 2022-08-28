import React from 'react';
import CounterStore from './CounterStore';
import styles from './Counter.module.css';

const Counter = () => {
  const { count, increment } = CounterStore.usePicker();

  return (
    <div className={styles.counter}>
      <span>count: </span>
      {count}
      <button type="button" onClick={increment}>
        Add
      </button>
    </div>
  );
};

export default React.memo(Counter);
