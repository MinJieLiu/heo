# Heo

> 简单、优雅的 React hooks 状态管理方案

[![CI](https://img.shields.io/github/workflow/status/MinJieLiu/heo/CI)](https://github.com/MinJieLiu/heo/actions?query=workflow%3ACI)
[![coveralls](https://img.shields.io/coveralls/MinJieLiu/heo.svg?style=flat-square)](https://coveralls.io/r/MinJieLiu/heo)
[![npm](https://img.shields.io/npm/v/heo)](https://www.npmjs.com/package/heo)
[![size](https://img.shields.io/bundlephobia/minzip/heo)](https://bundlephobia.com/result?p=heo)

- **自动优化** _完全按需 rerender，专注性能_
- **React Hooks** _适用于 React Hooks 组件_
- **1KB** _min+gz_
- **简单** _只需会 React Hooks，即可上手_
- **TypeScript 编写** _完备的类型提示，轻松编写代码_
- **容易集成** _可渐进式引入，与其他状态管理共存_
- **通用** _组件、模块、应用以及服务端渲染_
- **灵活** _基于 Context，轻松组合 Provider_
- **轻松迁移** _它基于自定义 Hooks 创建_

## 安装

```bash
npm i heo
```

## Example

```tsx
import { useState, useCallback, memo } from 'react';
import { createStore } from 'heo';

const CounterStore = createStore(() => {
  const [count, setCount] = useState(0);

  // 函数需要记忆化后导出
  const increment = useCallback(() => setCount(prev => prev + 1), []);
  const decrement = useCallback(() => setCount(prev => prev - 1), []);

  return {
    count,
    increment,
    decrement,
  };
});

const Counter = memo(() => {
  // 只有在 count 变化后才会触发 rerender
  const { count, increment } = CounterStore.usePicker();

  return (
    <div>
      {count}
      <button type="button" onClick={increment}>
        ADD
      </button>
    </div>
  );
});

function App() {
  return (
    <CounterStore.Provider>
      <Counter />
    </CounterStore.Provider>
  );
}
```

## 自动优化

`heo` 实现了自动按需优化，只有真正用到的数据变化后才会触发 `rerender`，减少了类似 `redux` 中 `useSelector` 的模板代码。

_由于使用了 `Proxy`，需兼容低版本浏览器请使用 v1 版本。_

## API

### `createStore(useHook)`

```tsx
import { useState, useCallback } from 'react';
import { createStore } from 'heo';

function useCustomHook() {
  const [value, setValue] = useState();
  const onChange = useCallback((e) => setValue(e.currentTarget.value), []);
  return {
    value,
    onChange,
  };
}

const Store = createStore(useCustomHook);
// Store === { Provider, usePicker }
```

### `Store.usePicker()`

自动监听从 `store` 中选择出来的值，若值发生改变，则触发 `rerender`

```tsx
function ChildComponent() {
  const { value } = Store.usePicker();
  return <span>{value}</span>;
}
```

### `<Store.Provider>`

`Store.Provider` 基本用法

```tsx
function Parent() {
  return (
    <Store.Provider>
      <ChildComponent />
    </Store.Provider>
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
    <Store.Provider initialState="value">
      <ChildComponent />
    </Store.Provider>
  );
}
```

### `Store.useSelector()`

通过函数监听当前容器中选择后的值，若值发生改变，则触发 `rerender`

```tsx
function ChildComponent() {
  const value = Store.useSelector((state) => state.value);
  return <span>{value}</span>;
}
```

## 性能提示

_你可能会需要用 `useCallback` 记住一个回调，但由于内部函数必须经常重新创建，记忆效果不佳，导致子组件重复 `rerender`。对于复杂的子组件，重新渲染会对性能造成影响。通过 [useMethods](https://juejin.cn/post/7026605205990932494)，可以保证函数地址永远不会变化。_

`Heo` 的灵感来自于 `unstated-next`，并解决了 `unstated-next` 中导致的 `context` 穿透的性能问题，无需过量拆分 `Provider` 组合来优化组件。
在大型模块/项目中性能极其重要，它能为我们节省大量的调优时间。

## License

MIT © [MinJieLiu](https://github.com/MinJieLiu)
