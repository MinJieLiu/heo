import React from 'react';
import CounterContainer from './CounterContainer';
import Counter from './Counter';

const App = () => (
  <CounterContainer.Provider>
    <Counter />
  </CounterContainer.Provider>
);

export default App;
