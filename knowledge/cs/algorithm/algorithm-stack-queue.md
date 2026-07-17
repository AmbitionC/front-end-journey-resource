栈和队列都是限制访问顺序的线性抽象：栈后进先出，队列先进先出。理解它们的关键不是记 API，而是维护不变量，并知道顺序如何对应解析、遍历、缓冲和调度。生产队列还要增加容量、确认、公平和背压，不能把 FIFO 数组直接当消息系统。

![栈的 LIFO、队列的 FIFO、两栈队列及任务调度中的操作模型](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/algorithm-stack-queue-operation-model-v1.webp)
*图：抽象数据类型规定可观察操作；具体数组、链表或双栈实现决定边界成本。*

## 栈：只操作一端

栈提供 `push`、`pop` 和 `peek`。数组尾部实现时三者通常为摊还 O(1)；链表头实现可稳定 O(1)。不变量是只能从 top 加入和移除，空栈 pop 必须有明确定义。

函数调用栈保存返回位置和局部状态；括号匹配把左括号压栈，遇右括号时检查顶部；DFS 可用显式栈避免递归深度限制。要获得与递归相同遍历顺序，邻居入栈顺序通常需要反转。

```js
function balanced(text) {
  const pairs = { ')': '(', ']': '[', '}': '{' };
  const stack = [];
  for (const ch of text) {
    if ('([{'.includes(ch)) stack.push(ch);
    else if (ch in pairs && stack.pop() !== pairs[ch]) return false;
  }
  return stack.length === 0;
}
```

## 队列：两端分工

队列在 tail enqueue，从 head dequeue。链表维护 head/tail 可 O(1)；环形数组用 head、tail 和 size 避免移动元素。JavaScript 数组 `shift()` 可能重排索引，频繁出队不宜用它模拟高吞吐队列。

[MIT 6.006 资料](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/pages/lecture-notes/)涵盖基本数据结构与遍历。BFS 用队列保证按边数从近到远访问，因此在无权图中第一次到达节点就是最短边数路径。任务调度和生产者—消费者缓冲也常以队列为起点。

## 两个栈实现队列

inStack 接收新元素，outStack 提供出队；当 outStack 为空时，把 inStack 全部倒入。一次搬运 O(n)，但每个元素最多入/出两个栈，因此一系列操作的摊还成本为 O(1)。[MIT 6.046 资料](https://ocw.mit.edu/courses/6-046j-design-and-analysis-of-algorithms-spring-2015/pages/lecture-notes/)提供摊还分析背景。

```text
enqueue(x): in.push(x)
dequeue():
  if out empty: while in not empty -> out.push(in.pop())
  return out.pop()
```

摊还 O(1) 不代表每次延迟恒定；实时系统可能更适合环形缓冲或增量搬运。

## Deque、优先队列与单调队列

双端队列允许两端插入删除，可实现滑动窗口。单调队列在入队时移除不可能成为最值的尾部元素，使窗口最大值整体 O(n)。优先队列按 priority 而非到达顺序出队，通常用堆实现；它不是普通 FIFO。

选择抽象时先看顺序语义：需要撤销/回溯用栈，层序或公平到达用队列，动态最高优先级用堆，窗口两端操作用 deque。

## 生产队列多出的语义

[RabbitMQ Queues](https://www.rabbitmq.com/docs/queues)展示消息队列还涉及持久性、消费者、确认和顺序。真实系统必须定义：容量满时阻塞、拒绝还是丢弃；消费者失败后消息何时重投；ack 前崩溃怎样处理；多个消费者是否还保证全局顺序。

“至少一次”意味着可能重复，消费逻辑按 messageId 幂等；“有序”常只在单分区或单消费者内成立。优先级可能让低优先任务饥饿，需要 aging 或配额。可见性超时要大于正常处理时长，又能在 worker 丢失时及时重投。

## 背压与容量

无界队列只是把过载转成内存和延迟事故。用 Little's Law 的直觉估算：到达速率高于处理速率时，积压持续增长。设置有界容量、生产者限速和 admission control，监控 depth、oldest age、enqueue/dequeue rate、处理耗时与 redelivery。

队列长度为零不一定健康，可能是生产者断了；长度很高也可能是计划内批处理。告警结合预期到达和最老消息 SLA。

## 测试不变量

对抽象结构测试空、单元素、扩容、交错操作和随机序列，并与简单参考实现比较。对任务队列测试重复 delivery、worker crash、ack 丢失、容量满、毒消息、优先级饥饿和优雅停机。

栈与队列看似基础，却训练了一个重要习惯：先明确可观察顺序和不变量，再选择满足复杂度与故障语义的实现。

## 参考资料

- [MIT OCW 6.006（2011）：Lecture Notes](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/pages/lecture-notes/)
- [MIT OCW 6.046J：Lecture Notes](https://ocw.mit.edu/courses/6-046j-design-and-analysis-of-algorithms-spring-2015/pages/lecture-notes/)
- [RabbitMQ：Queues](https://www.rabbitmq.com/docs/queues)
