import React from 'react';
import CounterStore from './CounterStore';
import Counter from './Counter';

const App = () => (
  <CounterStore.Provider>
    <Counter />
  </CounterStore.Provider>
);

export default App;
