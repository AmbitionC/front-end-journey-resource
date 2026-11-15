I/O 多路复用让一个线程等待多个文件描述符的就绪事件，再由应用执行读写。理解它的关键是分清“描述符已注册”“此刻可以尝试读写”和“完整业务消息已处理”：这三个状态并不相同。本文限定 Linux 的 select、poll 与 epoll；Java Selector 的应用循环另见[Java NIO 与 Reactor](../../backend/java/java-nio-reactor.md)。

## 三种接口怎样表达等待集合

select 和 poll 每次调用都提交待检查的集合；epoll 则先建立内核中的注册状态，之后等待就绪事件。以下比较的是工作方式，不是脱离负载的速度排名。

| 接口 | 怎样提供关注对象 | 结果与主要成本 | 容量边界 |
|---|---|---|---|
| select | fd_set 位图，加最高 fd 编号加一的 nfds | 返回后检查被改写的集合，下次调用前重新准备；检查范围与 fd 编号范围有关 | Linux 常用 glibc fd_set 受 FD_SETSIZE=1024 限制，约束是 fd 编号小于它 |
| poll | pollfd 数组，元素含 fd、events、revents | 每次提交数组并检查返回元素；大量不活跃元素仍增加处理成本 | 没有上述 fd_set 固定编号限制，但仍有打开文件数及内存限制 |
| epoll | epoll_create1 建实例，epoll_ctl 注册或修改关注项 | epoll_wait 取就绪事件，避免每轮重新提交整个关注集合；注册维护、事件投递和应用处理仍有成本 | 受进程 fd 限额、系统资源及每用户 epoll watch 限额等约束 |

[Linux select(2)](https://man7.org/linux/man-pages/man2/select.2.html)强调 fd_set 的编号上限；[poll(2)](https://man7.org/linux/man-pages/man2/poll.2.html)说明数组接口及 nfds 超过 RLIMIT_NOFILE 时的错误。不能说“poll 也有 select 的1024上限”，也不能说“epoll 解除了所有连接数限制”。fd 是进程资源的标识，不只代表网络连接；一个连接通常占用一个 socket fd，但进程还会打开文件、管道和 epoll 实例。

就绪也不是无条件成功：例如可读可能对应数据、EOF 或错误；并发消费者还可能先读走数据。事件循环应使用非阻塞 I/O 并解释实际调用结果，不能把通知当作完整消息或业务成功。

## epoll 的关注集合与就绪集合

[epoll(7)](https://man7.org/linux/man-pages/man7/epoll.7.html)从用户视角区分 interest list 与 ready list：前者记录想观察的对象，后者记录可交付的就绪引用。`epoll_ctl` 管理注册，`epoll_wait` 等待并取得事件；等待线程没有事件时仍可以阻塞，所以“I/O 多路复用”并不意味着线程永不阻塞。

讲内核数据结构时应注明版本。[Linux v6.12 的 eventpoll.c](https://github.com/torvalds/linux/blob/v6.12/fs/eventpoll.c)在 `struct eventpoll` 中使用 `rbr` 红黑树组织监控项、`rdllist` 链表组织就绪项，并有相应锁及等待队列。内核的事件回调把相关对象纳入就绪处理路径。红黑树、链表和回调是该版本的实现细节，不能替代 API 的就绪合同，也不能据此推出整个请求处理永远是 O(1)。

epoll 省掉的是反复提交、检查大量无变化关注项的部分工作，尤其适合关注集合大而每轮活跃对象相对少的情况。它仍需维护注册、投递事件、向用户空间交付结果并处理真实字节；返回 k 个事件，应用至少还要检查和处理这些事件。大量连接同时活跃、频繁注册删除或处理很轻时，实际收益必须测量。

## LT 与 ET：为什么只读一次会漏进度

LT 是默认的水平触发；ET 需要指定 EPOLLET。用手册中的情形理解区别：向已注册的管道写入2 KiB，事件循环获知可读，但只读出1 KiB，再次调用 epoll_wait。

| 此时还有1 KiB 未读 | LT | ET |
|---|---|---|
| 可以依赖什么 | 只要就绪条件持续满足，后续等待仍可报告就绪 | 不能指望仅因旧数据仍在就重新提醒，可能等待新的事件 |
| 应用要做什么 | 正确处理部分读与剩余状态，避免持续就绪造成空转 | 保持非阻塞读的进度，通常读到 EAGAIN/EWOULDBLOCK 后再等待新通知 |

ET 也不是“一个连接一生只通知一次”：后续事件仍可能到来，事件也可能合并。它改变通知语义，不把 read 变成读取完整消息的操作。上述例子与非阻塞排空建议来自[epoll(7) 的 LT/ET 说明](https://man7.org/linux/man-pages/man7/epoll.7.html)。

## ET 读写循环怎样收口

下面是针对非阻塞流式连接的协议伪代码，没有声称运行过服务器：

```text
收到可读事件后，尝试 read：
  n > 0：交给有边界的输入缓冲和分帧器，继续尝试
  n = 0：对端发送方向结束，按协议处理半关闭与资源释放
  EINTR：按取消策略决定继续或退出
  EAGAIN/EWOULDBLOCK：本轮暂无可读进度，等待后续事件
  其他错误：记录并按连接生命周期处理
```

![非阻塞 ET 读取按返回值继续保存解析字节和读取、暂空时等待新事件，或转入EOF与不可恢复错误的生命周期处理](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/linux-io-multiplexing-et-read-v2.png)
*图：先看 n>0 后继续读取的回路，再看 EAGAIN 后才回到等待的路径；若每轮预算先用完，仍需保存应用 ready 状态继续调度。本图只描述读取主路径，省略 EINTR 分支；EINTR 应按取消策略重试或退出。EOF 表示读取方向结束，不要求立即关闭整条连接，仍须按协议处理待写数据与连接生命周期。*

“读到 EAGAIN”需要兼顾公平性。若某个连接不断产出数据，单次无限排空可能饿死其他连接。可以设置每轮处理预算，把尚未排空的连接保留在应用自己的 ready 队列中轮转，继续尝试；没有确认排空时不能把它遗忘后只等新的 ET 通知。手册明确讨论了这种 starvation 与应用 ready list 的解决思路。

写方向同样要保存部分写后的剩余数据。应用有新输出时先尝试非阻塞写；遇到 EAGAIN 则保留偏移、订阅或保留适用的 EPOLLOUT 兴趣，收到事件后继续。输出队列清空后按策略撤销不需要的写兴趣；LT 下持续订阅通常可写的 socket 容易造成空转。ET 下若先前已收到可写通知，不能在后来才有输出时仅等待它再通知一次，应主动尝试写。是否一直注册 EPOLLOUT 是设计选择，不能把它写成所有 ET 实现必须反复切换的规定。

EPOLLONESHOT 是另一项机制：一次事件交付后禁用该关注项，需要以 EPOLL_CTL_MOD 重新启用。它可用于协调处理责任，但不自动完成连接互斥、关闭竞态或错误恢复。

## 技术选型比较哪些成本

对同一服务固定连接数、活跃比例、消息大小和连接变动速率，再比较吞吐、CPU、尾延迟、系统调用次数及内核/应用缓冲占用。把事件派发与业务耗时分开：慢数据库调用放在事件循环中，即使用 epoll 也会拖住其他连接。

容量还要检查 RLIMIT_NOFILE、实际打开的 fd、epoll watch 限额、每连接缓冲、业务队列与下游承载。提高 fd 上限不会自动提供足够内存或吞吐。小集合或可移植需求可能适合 poll；Linux 大集合可考虑 epoll；最终取舍来自实际负载和维护复杂度，而不是一句复杂度口号。

## 自查

能否解释为什么 poll 没有 fd_set 的固定上限、却仍有容量限制？能否在 ET 只读一半的例子中说明谁负责继续读取？能否区分一次可写事件、部分写完成和完整业务响应？如果这些问题能从状态与实际返回值解释，就比只背“红黑树加链表”更有用。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [腾讯云智二面：Spring、Java 内存模型与 IO 多路复用](../../../interview/tencent/ai/tencent-ai-32.md)
<!-- interview-source-history:end -->

## 参考资料

接口语义核验于2026-11-15；源码示例固定 Linux v6.12，不代表所有内核版本的数据结构均相同。

- [Linux man-pages：select(2)](https://man7.org/linux/man-pages/man2/select.2.html)
- [Linux man-pages：poll(2)](https://man7.org/linux/man-pages/man2/poll.2.html)
- [Linux man-pages：epoll(7)，集合、触发模式与公平性](https://man7.org/linux/man-pages/man7/epoll.7.html)
- [Linux v6.12：eventpoll.c](https://github.com/torvalds/linux/blob/v6.12/fs/eventpoll.c)
