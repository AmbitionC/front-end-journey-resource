ThreadLocal 解决的是“同一个变量在不同线程上绑定不同的值”。它不复制对象，也不让对象自动线程安全。理解线程持有的映射、弱 key 与强 value，以及线程池复用后的清理，才能判断上下文隔离和泄漏风险。

## 为什么需要每线程绑定

请求处理中，日志关联 ID 等信息可能被多层同步调用使用。把它作为参数显式传递最清晰；确需隐式读取时，可在请求线程上绑定上下文。这里的范围是线程，不是用户、会话或异步任务。换到另一线程执行后，普通 ThreadLocal 不会自动传播原值。[Java 21 ThreadLocal API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ThreadLocal.html)定义的是每个线程各自访问变量副本的合同。

<iframe
  src="/archify/java-thread-local.html"
  title="两个工作线程分别持有自己的 ThreadLocalMap，同一个弱引用 key 在各自 Entry 中绑定强引用 value；请求结束显式 remove"
></iframe>

## 先区分 API 与实现

`get()` 取得当前线程绑定；未绑定时调用初始化逻辑。`set()` 设置当前线程的值，`remove()` 删除当前线程绑定。删除后再 get 可以重新初始化，因此“每线程永远只有一个对象”并不成立。[API 的 initialValue、get 与 remove](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ThreadLocal.html)说明这些生命周期规则。

在 [OpenJDK 21 GA 的实现](https://github.com/openjdk/jdk/blob/jdk-21%2B35/src/java.base/share/classes/java/lang/ThreadLocal.java)中，线程对象关联 ThreadLocalMap；Entry 的 key 是 ThreadLocal 的弱引用，value 是普通强引用，哈希冲突用开放寻址处理。这是选定实现的细节，不应泛化成所有语言的线程局部存储。

读图时沿“线程 → 映射 → 值”理解引用链。key 失去外部强引用后可能被回收，但 value 仍可被活着的线程经 Entry 持有；清除失效 Entry 的机会不等于立即回收所有值。

## 请求边界显式清理

以下是未在本环境编译的 Java 21 教学片段，`process()` 表示业务调用：

```java
private static final ThreadLocal<String> REQUEST_ID = new ThreadLocal<>();

void handle(String id) {
    REQUEST_ID.set(id);
    try {
        process();
    } finally {
        REQUEST_ID.remove();
    }
}
```

清理须包含异常路径。线程池中的 worker 通常比单次请求活得久，不清理可能让下一任务读到旧身份，也可能长期持有大对象。若存在嵌套上下文，不宜内层无条件删除外层值，应在作用域结束恢复原值或使用明确的作用域封装。

## 两个常见错误

第一个是把同一可变对象分别 set 到多个线程，然后认为已隔离。隔离的是绑定，两个绑定仍可指向同一对象；对象内部并发访问仍需同步或改成不可变数据。

第二个是在线程池初始化时使用 InheritableThreadLocal 传请求状态。它的继承发生在线程创建时，无法代表后来提交的每个任务。更稳妥的异步边界是显式捕获必要的不可变上下文、进入任务时绑定、结束时清理；传播身份前还要检查授权和生命周期。[InheritableThreadLocal API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/InheritableThreadLocal.html)界定了继承时机。

## 验证隔离与释放

测试应让同一 worker 顺序运行两次任务，第一次含异常，第二次确认读不到旧值；另让两个线程分别设置不同值，再检查各自读取结果。共享对象测试应明确证明：绑定隔离不等于对象隔离。内存问题还需观察引用链，不能仅以执行过 GC 判断是否泄漏。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [字节全栈：预请求、列表复用与 ThreadLocal](../../../interview/bytedance/base/bytedance-base-44.md)
- [字节 Agent：任务取消、Spring 配置与并发执行](../../../interview/bytedance/base/bytedance-base-45.md)
- [字节全栈与测试：JVM、并发与 SQL 排查](../../../interview/bytedance/base/bytedance-base-56.md)
<!-- interview-source-history:end -->

## 参考资料

核验于 2026-10-04；API 与实现分别采用 Java 21 和 OpenJDK `jdk-21+35`。

- [Java 21：ThreadLocal](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ThreadLocal.html)
- [OpenJDK 21 GA：ThreadLocal.java](https://github.com/openjdk/jdk/blob/jdk-21%2B35/src/java.base/share/classes/java/lang/ThreadLocal.java)
- [Java 21：InheritableThreadLocal](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/InheritableThreadLocal.html)
