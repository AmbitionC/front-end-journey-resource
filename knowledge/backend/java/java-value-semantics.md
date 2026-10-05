Java 的变量保存值：基本类型变量保存数值等基本值，引用类型变量保存引用值。理解“复制了什么”和“何时确定完成结果”，就能区分对象修改、参数重绑、字符串相等和 finally 覆盖返回。本文以 Java SE 21 语言规范为依据，不把具体对象地址或编译器优化当成语言保证。

## 值传递为什么还能改到对象

调用方法时，实参表达式先得到值，再用这些值初始化形参；对象参数复制的是引用值，而不是对象本体，也不是调用方变量这个槽位。[JLS 21 §15.12.4.5](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12.4.5)规定了形参用实参值初始化的行为。

下面是语义伪代码推演，不是经过本机 JVM 编译的执行记录：

```text
调用方：box 指向对象 O，O.value = 1
调用 change(box)：形参 p 复制引用值，也指向 O
change 内执行 p.value = 2：修改 O，调用方能观察到 2
change 内执行 p = 新对象 P：只重绑 p，调用方 box 仍指向 O
```

对基本类型也一样：方法内改变数值形参，只改变它的副本。共享可变对象说明有别名，不说明语言采用引用传递；需要返回新对象、明确修改传入对象或使用封装的可变容器，才能设计调用方观察到的结果。

## 身份相等与内容相等

引用的 == 问两个值是否指向同一对象；equals 是实例方法，其含义由类型实现决定。String.equals 比较字符序列，因此不同 String 对象可以内容相等。Object 的默认 equals 仍按身份，不能说所有 equals 都比较字段。

基本数值的 == 使用对应的数值比较规则，包装对象却可能走引用比较；整数包装缓存会让某些例子“碰巧相同”，不是可靠的业务比较方法。[Objects.equals](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Objects.html#equals(java.lang.Object,java.lang.Object))提供空值安全的 equals 调用，并不把不同数值包装类型统一换算。例如 Integer 与 Long 的 equals 不是仅按数学数值判断。

## String 不可变，拼接成本依场景

[String 的契约](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html)保证字符串不可变。修改变量的引用不修改旧字符串；+ 产生新的字符串结果，但编译期常量可以折叠，运行时拼接也允许实现优化，所以“每个 + 都构造 StringBuilder”并非语言规范。

在反复追加、每次都物化不断变长前缀的朴素模型中，若每段长度固定，总拷贝量为 1+2+…+n，达到二次量级；StringBuilder 累积后一次取结果可以避免这类反复前缀物化。这个推演有明确条件，不是对所有 JIT 优化结果的性能断言。少量一次性拼接先选清楚的写法，热点循环再用真实负载测量。

## 返回表达式与 finally 的完成方式

try 中遇到 return 时，先求返回表达式，再执行 finally。finally 正常结束则保留这个返回；如果 finally 自己 return、throw 或产生其他异常完成，它就取代之前的完成原因。[JLS 21 §14.20.2](https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.20.2)明确区分这两条路径。

| 条件化伪代码 | 结果 |
|---|---|
| try 返回 1；finally 正常清理 | 返回 1 |
| try 返回 1；finally 返回 2 | 返回 2 |
| try 抛异常 A；finally 抛异常 B | 最终传播 B，A 的完成原因被覆盖 |
| try 返回对象 O；finally 修改 O 的字段后正常结束 | 仍返回 O 的引用，字段变化可见 |
| try 返回局部数值 x；finally 只重赋值 x 后正常结束 | 保留已求出的返回数值 |

因此 finally 适合清理，不宜用 return 掩盖业务失败；资源也可以用 try-with-resources 明确关闭语义。不能把“finally 会执行”说成进程被强制结束时仍有可靠清理保证。

## 口述与教学追问

Java 传递实参值的副本；对象引用的副本仍可定位同一个可变对象，但重绑形参不改变调用方变量。== 和 equals 分别要看基本值或引用身份、类型的比较契约；return 还需看 finally 的完成方式。

教学追问：把对象形参改为不可变 String，会怎样影响“修改对象”的说法？finally 正常结束但改了返回对象的字段，与改数值变量有何不同？两个不同包装类型都表示 1，Objects.equals 为何不必返回真？答案分别依赖不可变性、引用值与已求值结果，以及类型自己的 equals 契约。

## 基本类型与共享字符串构建器

Java 基本类型是 byte、short、int、long、float、double、char、boolean，String 为引用类型。[JLS 21 类型规则](https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html)区分基本与引用类型；char 是 UTF-16 代码单元，不能代表所有用户可见字符。

String 不可变；StringBuilder 可变且不保证并发安全，StringBuffer 的适用方法同步，但多个调用组成的业务动作仍可能需要外层协调。共享状态安全不能只看某个方法有 synchronized。[StringBuilder API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/StringBuilder.html)与[StringBuffer API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/StringBuffer.html)界定各自合同。

单例是实例生命周期策略，也不是线程安全的同义词。若展示双重检查锁，要保证实例安全发布，不能把锁外读取与锁内创建视为天然正确；静态持有者等方式可利用类初始化规则。原帖另一个被遮蔽的关键字题没有完整内容，知识补充不代表恢复了那道原题。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [字节全栈一面：RAG、Java与线程池](../../../interview/bytedance/base/bytedance-base-37.md)
- [字节全栈实习：Session、权限与前端基础](../../../interview/bytedance/base/bytedance-base-46.md)
- [字节 Agent：幻觉、任务恢复与 Java 基础](../../../interview/bytedance/base/bytedance-base-50.md)
- [字节全栈与测试：JVM、并发与 SQL 排查](../../../interview/bytedance/base/bytedance-base-56.md)
<!-- interview-source-history:end -->

## 参考资料

- [JLS 21：方法调用、相等与字符串拼接](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html)（2026-10-03核验）
- [JLS 21：try/finally](https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.20.2)
- [JDK 21：String](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html)
- [JDK 21：Objects.equals](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Objects.html)
