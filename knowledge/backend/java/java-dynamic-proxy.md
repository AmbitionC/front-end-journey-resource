动态代理在运行时生成间接调用入口，把日志、事务或其他横切行为放在真实业务调用周围。学习目标是沿实际调用路径比较 JDK 接口代理与 CGLIB 子类代理，并判断某个方法为何没有被增强。

## 先确认调用的是谁

客户端必须拿到代理对象，调用才有机会经过拦截器。若客户端直接持有目标对象，或者目标内部通过 `this` 调用自身方法，典型的 Spring 代理式 AOP 不会因此再经过外部代理。这是调用路径问题，不是添加了注解就自动消失。[Spring 代理机制](https://docs.spring.io/spring-framework/reference/core/aop/proxying.html)明确解释了 self-invocation 的边界；织入式 AOP 是另一种机制。

![接口代理实现接口并把调用交给处理器，子类代理通过覆写可覆写方法拦截目标行为；final与this自调用分别有边界](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/java-dynamic-proxy-paths-v1.png)

## JDK 动态代理为什么围绕接口

[Java 21 Proxy 文档](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/Proxy.html)说明生成类继承 Proxy 并实现指定接口。通过接口发起的方法调用被编码后交给 InvocationHandler.invoke，由处理器决定是否、如何转发给目标。处理器也可以不使用一个普通目标对象，因此“代理一定直接反射调用目标”并非完整定义。

JDK Proxy 的机制就是生成接口实现，并不是先选目标类再对其任意方法做子类覆写。模块可访问性、类加载器与接口限制也要按所用 Java 版本核对，不能只检查 `implements` 一项。

## CGLIB 为什么受 final 限制

CGLIB 的常见用法生成目标类的子类，通过覆写方法插入拦截逻辑。final 类不能继承；final 方法不能覆写，因此不能用这种覆写路径增强它。private 方法同样不提供普通的子类覆写入口。[Spring 文档](https://docs.spring.io/spring-framework/reference/core/aop/proxying.html)同时提醒模块系统与可见性可能进一步限制代理。

这不等于“final 类的任何行为永远不能被代理”：若它实现接口，外部仍可通过独立的 JDK 接口代理对象委托给它。应区分接口调用入口和子类覆写的限制。

## 字节码工具与代理框架的层次

字节码库生成或转换类文件，代理框架在其上提供更高级的调用拦截抽象。[CGLIB 项目](https://github.com/cglib/cglib)说明其与 ASM 的依赖关系，也提醒项目维护与新 Java 版本兼容性问题。ASM、Byte Buddy 等是不同抽象层的工具，不能把知道工具名字当成任意运行时都兼容或性能必然更好。

选择时先核对 Java 版本、模块边界、要增强的方法、框架实际配置与维护状况。Spring Framework 的建议和 Spring Boot 的默认配置可能不同，不能笼统断言“只要有接口就一定使用 JDK 代理”。

## 用最小调用矩阵验证

分别测试：客户端经代理调用接口方法、直接调用目标、目标内部 `this` 自调用，以及 final 方法。记录拦截器是否进入和目标是否执行。需要事务增强时，再验证事务实际提交或回滚；仅检查类名带有代理字样不能证明事务边界正确。

本文比较机制，不提供所有 JDK/CGLIB 版本的性能排名；上面的验证是建议设计，没有声称已运行具体项目。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [阿里云后端与 Agent 二面：领域建模、训练并行与 Java 基础](../../../interview/alibaba/ai/alibaba-ai-28.md)
<!-- interview-source-history:end -->

## 参考资料

- [Java SE 21：Proxy](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/Proxy.html)
- [Spring Framework：Proxying Mechanisms](https://docs.spring.io/spring-framework/reference/core/aop/proxying.html)
- [CGLIB：项目与 ASM 依赖](https://github.com/cglib/cglib)
