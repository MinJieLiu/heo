import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { createContainer, useFunction, useMethods } from '.';

describe('render spec', () => {
  afterEach(cleanup);

  it('should not render with other', () => {
    const CounterContainer = createContainer(() => {
      const [count, setCount] = React.useState(0);
      const [total, increment] = React.useReducer((c) => c + 1, 0);

      const [userId, setUserId] = React.useState('jack');

      const setUserTonny = useFunction(() => {
        setUserId('tonny');
      });

      const methods = useMethods({
        setUserMarry() {
          setUserId('marry');
        },
      });

      return {
        count,
        setCount,
        total,
        increment,

        userId,
        setUserTonny,
        methods,
      };
    });

    const Counter1 = React.memo(() => {
      const { count, setCount } = CounterContainer.usePicker(['count', 'setCount']);
      const increment = () => setCount((s) => s + 1);

      const renderCount = React.useRef(0);

      if (renderCount.current !== count) throw new Error('Inconsistent rendering (1)!');

      renderCount.current += 1;

      return (
        <div>
          <span>{count}</span>
          <button type="button" onClick={increment}>
            ADD1
          </button>
        </div>
      );
    });

    const Counter2 = React.memo(() => {
      const { total, increment } = CounterContainer.usePicker(['total', 'increment']);

      const renderCount = React.useRef(0);

      if (renderCount.current !== total) throw new Error('Inconsistent rendering (2)!');

      renderCount.current += 1;
      return (
        <div>
          <span>{total}</span>
          <button type="button" onClick={increment}>
            ADD2
          </button>
        </div>
      );
    });

    const Counter3 = React.memo(() => {
      const increment = CounterContainer.useSelector((c) => c.increment);
      return (
        <button type="button" onClick={increment}>
          ADD3
        </button>
      );
    });

    const Counter4 = React.memo(() => {
      const { setUserTonny, methods } = CounterContainer.usePicker(['setUserTonny', 'methods']);

      const renderCount = React.useRef(0);

      if (renderCount.current > 0) throw new Error('Inconsistent rendering (4)!');

      renderCount.current += 1;

      return (
        <>
          <button type="button" onClick={setUserTonny}>
            ADD4
          </button>
          <button type="button" onClick={methods.setUserMarry}>
            ADD5
          </button>
        </>
      );
    });

    const App = () => (
      <CounterContainer.Provider>
        <Counter1 />
        <Counter2 />
        <Counter3 />
        <Counter4 />
      </CounterContainer.Provider>
    );
    const { getAllByText } = render(<App />);
    expect(() => fireEvent.click(getAllByText('ADD1')[0])).not.toThrow();
    expect(() => fireEvent.click(getAllByText('ADD2')[0])).not.toThrow();
    expect(() => fireEvent.click(getAllByText('ADD3')[0])).not.toThrow();
    expect(() => fireEvent.click(getAllByText('ADD4')[0])).not.toThrow();
    expect(() => fireEvent.click(getAllByText('ADD5')[0])).not.toThrow();
  });
});
