React组件的生命周期可以分为三个主要阶段：挂载（Mounting）、更新（Updating）和卸载（Unmounting）。每个阶段都包含了一系列的方法，这些方法在组件的不同生命周期内被调用。

| 生命周期阶段 | 方法名 | 描述 |
| --- | --- | --- |
| 挂载（Mounting） | constructor(props) | 组件的构造函数。在创建组件的实例时被调用，用于初始化状态。 |
| | getDerivedStateFromProps(props, state) | 在组件实例化后和接收新属性时将会调用。用于将props映射到state上。 |
| | render() | 必需的方法。读取 `this.props`<br/> 和 `this.state`<br/>，并返回一个React元素。 |
| | componentDidMount() | 组件挂载到DOM后调用。可以在这里进行API调用等异步操作。 |
| 更新（Updating） | getDerivedStateFromProps(props, state) | 在接收到新的props时调用。用于根据props修改state。 |
| | shouldComponentUpdate(nextProps, nextState) | 在接收到新的props或state时调用。可以返回false来避免重新渲染。 |
| | render() | 用于更新组件的渲染。根据新的props或state返回新的React元素。 |
| | getSnapshotBeforeUpdate(prevProps, prevState) | 在最新的渲染输出提交给DOM前将会立即调用。用于捕获信息（如滚动位置）。 |
| | componentDidUpdate(prevProps, prevState, snapshot) | 更新后立即调用。可以在这里进行DOM操作或者执行更多的API调用。 |
| 卸载（Unmounting） | componentWillUnmount() | 组件卸载及销毁之前直接调用。用于执行必要的清理操作，如取消计时器、网络请求等。 |
| 错误处理（Error Handling） | getDerivedStateFromError(error) | 当捕获到子组件的错误时被调用。用于渲染备用UI。 |
| | componentDidCatch(error, info) | 当捕获到子组件的错误时被调用。可以用于记录错误信息。 |


#### 挂载阶段（Mounting）
+ `**constructor()**`： 
    - 构造函数，用于初始化组件的状态（`this.state`）和绑定事件处理函数。
+ `**getDerivedStateFromProps()**`： 
    - 静态方法，用于在组件创建之前，根据props计算新的state。
+ `**render()**`： 
    - 必选方法，用于生成组件的虚拟DOM。
+ `**componentDidMount()**`： 
    - 生命周期方法，在组件挂载到DOM后调用，适合进行订阅或动画等操作。



#### 更新阶段（Updating）
+ `**getDerivedStateFromProps()**`（如果未在挂载阶段被`UNSAFE_componentWillReceiveProps`替代）： 
    - 同挂载阶段的`getDerivedStateFromProps`。
+ `**shouldComponentUpdate()**`： 
    - 生命周期方法，用于控制组件是否应该重新渲染。
+ `**UNSAFE_componentWillReceiveProps()**`（不推荐使用，计划在未来版本中移除）： 
    - 生命周期方法，在组件接收新的props之前调用，可以用于更新state或执行其他操作。
+ `**getSnapshotBeforeUpdate()**`： 
    - 生命周期方法，在`render`方法执行之前调用，可以用于获取滚动位置等信息。
+ `**componentDidUpdate()**`： 
    - 生命周期方法，在组件更新后调用，适合执行依赖于DOM的操作，如动画或获取子元素的尺寸。



#### 卸载阶段（Unmounting）
+ `**componentWillUnmount()**`： 
    - 生命周期方法，在组件从DOM中移除之前调用，用于执行清理工作，如取消订阅或清除定时器。



#### 其他重要方法
+ `**static getDerivedStateFromError()**`： 
    - 静态方法，用于处理渲染过程中抛出的错误。
+ `**static componentDidCatch()**`： 
    - 静态方法，用于捕获组件树中子孙组件的错误。

