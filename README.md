# Heo

> 简单、优雅的 React hooks 状态管理方案

[![CI](https://img.shields.io/github/workflow/status/MinJieLiu/heo/CI)](https://github.com/MinJieLiu/heo/actions?query=workflow%3ACI)
[![npm](https://img.shields.io/npm/v/heo)](https://www.npmjs.com/package/heo)
[![size](https://img.shields.io/bundlephobia/minzip/heo)](https://bundlephobia.com/result?p=heo)

- **React Hooks** _适用于 React Hooks 组件_
- **专注性能** _减少额外 rerender，运行畅快_
- **1KB** _min+gz_
- **无依赖** _仅仅使用了 React，无第三方库的依赖_
- **简单** _只需会 React Hooks，即可上手_
- **TypeScript 编写** _完备的类型提示，轻松编写代码_
- **容易集成** _可渐进式引入，与其他状态管理共存_
- **通用** _组件、模块、应用以及服务端渲染_
- **灵活** _基于 Context，轻松组合 Provider_
- **轻松迁移** _它基于自定义 Hooks 创建_

## 安装

```bash
npm install --save heo
```

## Example

```tsx
import React from 'react';
import { createContainer, useMethods } from 'heo';

function useCounter() {
  const [count, setCount] = React.useState(0);

  const methods = useMethods({
    increment() {
      setCount(count + 1);
    },
    decrement() {
      setCount(count - 1);
    },
  });

  return {
    count,
    methods,
  };
}

const CounterContainer = createContainer(useCounter);

function CounterDisplay() {
  const { count, methods } = CounterContainer.usePicker(['count', 'methods']);

  return (
    <div>
      {count}
      <button type="button" onClick={methods.increment}>
        ADD
      </button>
      <button type="button" onClick={methods.decrement}>
        MINUS
      </button>
    </div>
  );
}

function App() {
  return (
    <CounterContainer.Provider>
      <CounterDisplay />
    </CounterContainer.Provider>
  );
}

render(<App />, document.getElementById('root'));
```

## API

### `createContainer(useHook)`

```tsx
import { createContainer, useFunction } from 'heo';

function useCustomHook() {
  const [value, setInput] = useState();
  const onChange = useFunction((e) => setValue(e.currentTarget.value));
  return {
    value,
    onChange,
  };
}

const Container = createContainer(useCustomHook);
// Container === { Provider, usePicker }
```

### `<Container.Provider>`

Container.Provider基本用法

```tsx
function ParentComponent() {
  return (
    <Container.Provider>
      <ChildComponent />
    </Container.Provider>
  );
}
```

Container.Provider支持Function的children

```tsx
function useCustomHook() {
  const [value, setValue] = useState();
  return { value };
}

function ParentComponent() {
  return (
    <Container.Provider>
      {({ value })=>{
        // use value to do something in top component.
        // const computedValue=doSomething(value);
        return <ChildComponent />
      }}
    </Container.Provider>
  );
}
```

### `<Container.Provider initialState>`

```tsx
function useCustomHook(initialState = '') {
  const [value, setValue] = useState(initialState);
  // ...
}

function ParentComponent() {
  return (
    <Container.Provider initialState="value">
      <ChildComponent />
    </Container.Provider>
  );
}
```

### `Container.useSelector()`

监听当前容器中选择后的值，若值发生改变，则触发 `rerender`

```tsx
function ChildComponent() {
  const value = Container.useSelector((state) => state.value);
  return <span>{value}</span>;
}
```

### `Container.usePicker()`

`useSelector` 的语法糖，更常用的写法

```tsx
function ChildComponent() {
  const { value } = Container.usePicker(['value']);
  return <span>{value}</span>;
}
```

### `Container.withPicker()`

`usePicker` 的高阶组件形式

```tsx
function ChildComponent({ value }) {
  return <span>{value}</span>;
}

Container.withPicker(ChildComponent, ['value']);
```

### `useMethods` & `useFunction`

持久化 `function` 的 `Hook`。

_你可能会需要用 `useCallback` 记住一个回调，但由于内部函数必须经常重新创建，记忆效果不佳，导致子组件重复 render。对于复杂的子组件，重新渲染会对性能造成影响。通过 `useMethods`，可以保证函数地址永远不会变化。_

## 性能提示

`Heo` 的灵感来自于 `unstated-next`，并解决了 `unstated-next` 中导致的 `context` 穿透的性能问题，而无需过量抽象组合优化组件。
在大型模块/项目中性能极其重要，它能为我们节省大量的调优时间。

### 导出成员记忆化

在 `React Hooks` 中，每一次 `setState` 会重新执行一遍当前的 `function`，也就是 `rerender`。在这个特性下，组件的内部 `function` 也会随着 `rerender` 而重新创建，表达式也会重新执行，`useMemo` 、`useCallBack` 也因此而存在。

`Heo` 的记忆特性也与 `React` 保持一致。在下方 `useCounter` 返回值中，函数需要 `useMethods` 包裹才能达到记忆效果。因此需要注意：**不要导出会随着每次 render 而重新创建的可变对象**。`Heo` 无需优化，所有你要做的优化，都是标准的 React 优化。

```tsx
function useCounter() {
  const [count, setCount] = React.useState(0);

  const methods = useMethods({
    increment() {
      setCount(count + 1);
    },
    decrement() {
      setCount(count - 1);
    },
    handleClick() {
      // 可通过 this 调用
      this.increment();
      // ...
    },
  });

  return {
    count,
    methods,
  };
}

const Counter = createContainer(useCounter);
```

## License

MIT © [MinJieLiu](https://github.com/MinJieLiu)
