| 特性 | Pure Component | shouldComponentUpdate |
| :---: | --- | --- |
| **性能优化方法** | 组件自动实现了浅比较的 shouldComponentUpdate | 需要手动实现 shouldComponentUpdate |
| **比较机制** | 浅比较 (shallow compare) | 自定义逻辑比较 |
| **使用场景** | 当组件的 props 和 state 结构简单时更高效 | 当需要更复杂的比较逻辑时使用 |
| **渲染决策** | 如果 props 或 state 没有变化，则不会重新渲染 | 可以根据需要自定义是否需要重新渲染的条件 |
| **继承关系** | 继承自 React.PureComponent | 用在 React.Component 的组件中 |
| **自动化程度** | 更自动化，无需手动写比较逻辑 | 需要开发者根据具体需求编写比较逻辑 |


