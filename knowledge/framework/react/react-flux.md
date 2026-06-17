Flux是一种用于构建客户端Web应用程序的架构模式，由Facebook开发并推广。Flux的目标是通过单向数据流和统一的通信层来创建一个可预测、易于维护和调试的应用程序。Flux架构模式的核心概念包括：Dispatcher（调度器）、Store（存储）、View（视图）和Action（动作）。

![](https://cdn.nlark.com/yuque/0/2024/png/577681/1711864613211-a437a9ad-3dd1-42c5-97ee-0adfda2869d3.png)

#### 1. Dispatcher（调度器）
Dispatcher是Flux架构的中心通信层，所有数据的流动都会经过它。它负责接收动作（Action），然后广播这些动作到所有的Store。Dispatcher确保了所有的数据流都是单向的，从而避免了双向绑定带来的复杂性和难以追踪的问题。



#### 2. Store（存储）
Store是应用程序中的状态的容器。每个Store对应应用程序中的一个数据领域，比如用户信息、产品列表等。Store负责接收来自Dispatcher的动作，并根据动作类型和数据更新自己的状态。更新后的Store会通知View，以便View能够展示最新的数据。



#### 3. View（视图）
View是应用程序的用户界面，通常是由React组件构成。View通过观察Store来获取数据，并在数据变化时更新UI。View不能直接修改Store中的数据，它只能通过发送动作到Dispatcher来触发数据的变化。



#### 4. Action（动作）
Action是描述发生了什么事情的简单对象。它包含了一个类型（type）和一个payload（载荷，即动作的数据）。当用户与界面交互时（如点击按钮），View会创建一个Action并发送给Dispatcher。Action是单向数据流的起点。



#### Flux架构的工作流程
1. 用户与View交互，触发Action的创建。
2. View将Action发送给Dispatcher。
3. Dispatcher接收到Action后，将其分发给所有相关的Store。
4. Store接收到Action，根据Action的类型和数据更新自己的状态。
5. Store更新后，通知View数据已变化。
6. View从Store获取新数据，并更新UI。



#### Flux的优势
+ **可预测性**：单向数据流使得数据的流动变得清晰和可预测。
+ **易于调试**：统一的数据流和生命周期使得调试和追踪问题更加容易。
+ **解耦**：View和Store之间的解耦使得代码更加模块化，易于维护和扩展。



#### Flux的变体
随着React和相关技术的发展，Flux架构也出现了一些变体，如Redux和MobX，它们在Flux的基础上进行了优化和改进，提供了更强大的功能和更灵活的使用方式。

+ **Redux**：是Flux的一个变体，它引入了不可变数据流和中间件的概念，使得状态管理更加严格和灵活。
+ **MobX**：提供了更简单的状态管理方式，允许直接操作状态，而不是通过动作和分发器。

