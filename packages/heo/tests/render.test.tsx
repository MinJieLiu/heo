import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { createStore } from '../src';

describe('render spec', () => {
  afterEach(cleanup);

  it('should not render with other', () => {
    const CounterContainer = createStore(() => {
      const [count, setCount] = React.useState(0);
      const [total, increment] = React.useReducer((c) => c + 1, 0);

      const [user, setUser] = React.useState({ id: 'jack' });

      const setUserTonny = React.useCallback(() => {
        setUser({ id: 'tonny' });
      }, []);

      const setUserMarry = React.useCallback(() => {
        setUser({ id: 'marry' });
      }, []);

      return {
        count,
        setCount,
        total,
        increment,

        user,
        setUserTonny,
        setUserMarry,
      };
    });

    const Counter1 = React.memo(() => {
      const { count, setCount } = CounterContainer.usePicker();
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
      const { total, increment } = CounterContainer.usePicker();

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
      const total = CounterContainer.useSelector((c) => c.total);

      const renderCount = React.useRef(0);
      if (renderCount.current !== total) throw new Error('Inconsistent rendering (3)!');
      renderCount.current += 1;

      return null;
    });

    const Counter4 = React.memo(() => {
      const increment = CounterContainer.useSelector((c) => c.increment);
      return (
        <button type="button" onClick={increment}>
          ADD3
        </button>
      );
    });

    const Counter5 = React.memo(() => {
      const { setUserTonny, setUserMarry } = CounterContainer.usePicker();

      const renderCount = React.useRef(0);
      if (renderCount.current > 0) throw new Error('Inconsistent rendering (5)!');
      renderCount.current += 1;

      return (
        <>
          <button type="button" onClick={setUserTonny}>
            ADD4
          </button>
          <button type="button" onClick={setUserMarry}>
            ADD5
          </button>
        </>
      );
    });

    const Counter6 = React.memo(() => {
      const user = CounterContainer.useSelector((c) => c.user);

      const userChangeCount = React.useRef(0);

      React.useMemo(() => {
        userChangeCount.current += 1;
      }, [user]);

      const renderCount = React.useRef(0);
      renderCount.current += 1;

      if (renderCount.current > userChangeCount.current)
        throw new Error('Inconsistent rendering (6)!');

      return <div>{user.id}</div>;
    });

    const App = CounterContainer.withProvider(() => (
      <>
        <Counter1 />
        <Counter2 />
        <Counter3 />
        <Counter4 />
        <Counter5 />
        <Counter6 />
      </>
    ));
    const { getAllByText, container } = render(<App />);
    expect(container).toMatchSnapshot();

    expect(() => fireEvent.click(getAllByText('ADD1')[0])).not.toThrow();
    expect(() => fireEvent.click(getAllByText('ADD2')[0])).not.toThrow();
    expect(() => fireEvent.click(getAllByText('ADD3')[0])).not.toThrow();
    expect(() => fireEvent.click(getAllByText('ADD4')[0])).not.toThrow();
    expect(() => fireEvent.click(getAllByText('ADD5')[0])).not.toThrow();

    expect(container).toMatchSnapshot();
  });
});
