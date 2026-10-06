Java NIO 的 Selector 通知的是“某个连接可以尝试 I/O”，不是“完整业务消息已经到达”。Reactor 把这些就绪事件交给事件循环处理，配合非阻塞读写、连接状态和业务工作线程，才能在较少线程下管理许多连接。

## 为什么不为每个等待都占一条线程

很多连接大部分时间等网络数据，逐连接阻塞线程会增加栈与调度成本。Selector 让一个线程等待多个已注册 Channel 的就绪状态；Java API 并未要求所有平台使用同一种底层系统调用。[Java 21 Selector](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/channels/Selector.html)定义了注册、键集合和 selection 操作。

<iframe
  src="/archify/java-nio-reactor.html"
  title="连接注册到 Selector，就绪后由事件循环非阻塞读写并维护连接状态；耗时业务交工作线程，结果通过队列交回原事件循环"
></iframe>

## 一次循环做什么

为非阻塞 Channel 注册兴趣操作，例如接受连接、读取或写入；等待 select 返回；遍历就绪键，移除已处理的 selected key，再按操作维护连接。连接还保存读缓冲、写队列和协议解析状态，关闭时取消键并释放资源。

就绪集合与兴趣集合不是同一份状态。普通 `select()` 更新 selected-key set，处理者须按合同移除；另有 Consumer 形式的选择 API，集合语义不同，不能把两种示例混用。[Selector 的 Selection 说明](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/channels/Selector.html#selection)是此处 API 边界。

## 部分读写决定缓冲区设计

非阻塞 `read` 可以返回零、部分字节或流结束，业务包可能跨多次读取；`write` 也可能只写一部分。SocketChannel 本身不提供“一个调用等于一条业务消息”的合同。[SocketChannel API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/channels/SocketChannel.html)描述读写与关闭语义。

因此解析器要保存剩余字节，按长度前缀、分隔符或明确协议分帧。写不完时保存剩余缓冲，待可写后继续；无待写数据时取消写兴趣，避免持续可写导致事件循环空转。必须限制单连接缓冲，慢客户端不能无限积压数据。

## 事件循环与工作线程的职责

事件循环应尽快完成 I/O 与轻量解析，不在其中执行慢数据库调用或大计算。耗时业务可提交有界执行器，完成后通过队列把结果送回所属循环，由它维护该连接的写队列与键状态。其他线程可用 `wakeup()` 让阻塞的选择操作尽快返回；这不是自动执行业务回调。[Selector wakeup](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/channels/Selector.html#wakeup())定义了唤醒效果。

下面是未编译的算法伪代码，不是可直接部署的 Java 服务器：

```text
循环：
  select 等待就绪或唤醒
  取出并应用其他线程投递的连接命令
  遍历 selected keys，并从集合移除已处理键
  检查键仍有效，再进行非阻塞读写
  完整消息提交给有界业务执行器
  按剩余输出调整写兴趣；关闭时清理连接
```

执行器满时需明确拒绝或暂停读取，不能把压力转成无界队列。取消或关闭发生后，迟到的业务结果也要按连接版本与状态丢弃。

## Reactor 与异步完成通知

Reactor 围绕就绪事件，应用仍调用读写并处理返回；异步完成模型则报告已提交操作的结果。两者都可能使用事件循环，但不能因为没有阻塞线程就称它们完全相同。

验证应覆盖一条消息分多次读、一次读多条、部分写、慢读者、断开、任务队列饱和和迟到结果。只测试本机一次收发，容易隐藏缓冲与生命周期问题。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [字节 Agent：任务取消、Spring 配置与并发执行](../../../interview/bytedance/base/bytedance-base-45.md)
<!-- interview-source-history:end -->

## 参考资料

核验于 2026-10-04；API 采用 Java 21。线程分工、队列和背压是本文设计说明，不声称已经运行服务器。

- [Java 21：Selector](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/channels/Selector.html)
- [Java 21：SocketChannel](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/channels/SocketChannel.html)
- [Java 21：SelectableChannel](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/channels/SelectableChannel.html)
