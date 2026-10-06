动态配置有两个不同问题：同名属性从哪里解析，以及运行中的业务怎样切换到新版本。把配置中心 PropertySource 放到前面只解决优先级；普通 @Value 字段不会因此自动重注入。可靠更新需要明确触发、校验、应用与故障回退。

## 为什么先看真实属性链

Spring Boot 支持文件、环境变量、系统属性和命令行等来源。Boot 3.5 文档按可覆盖顺序列出来源，后列出的来源通常覆盖前面的同名值；实际应用还可通过扩展插入属性源。[Externalized Configuration](https://docs.spring.io/spring-boot/3.5/reference/features/external-config.html)是此处默认顺序的依据。

<iframe
  src="/archify/spring-external-config.html"
  title="配置中心发布带版本快照，应用验证后替换配置，业务读取一致快照；监听漏事件由版本对账补齐，失败时保留最后有效值"
></iframe>

## 自建属性源怎样获得优先级

Environment 中的 MutablePropertySources 支持添加、移动和替换来源，`addFirst` 可把一个来源放在查询链前面。[Spring 6.2.19 MutablePropertySources API](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/core/env/MutablePropertySources.html)说明顺序操作。

关键是时机：需要在相关属性被读取前加入，而且检查后续框架扩展是否再次插入更高优先级来源。某些启动属性很早被读取，等 Bean 创建完再加入会太晚。测试时故意在文件、环境与命令行提供冲突值，确认业务最终读取值与来源，而不是只检查远端已经发布。

## Environment 更新不等于 Bean 字段更新

普通 `@Value` 注入在创建或装配 Bean 时解析；修改属性链不承诺原对象里的字段自动改变。可选择框架提供且确已启用的刷新机制，也可让业务显式从可更新配置对象读取。两种方案都要说明并发和资源生命周期，不能只发一个事件就称动态更新完成。

一种较容易推理的应用方案是不可变配置快照：取得完整版本，校验 Schema 与业务约束，构造新对象，再以一次原子引用替换当前快照。单次业务操作只捕获一次快照，避免一次请求前后读到不同版本。以下是未在本环境编译的 Java 设计片段，省略解析与持久化：

```java
record Settings(long version, int maxAttempts, long timeoutMs) {}
AtomicReference<Settings> current = new AtomicReference<>(validatedInitial);

Settings forOneRequest = current.get();
// 后台更新：先完成校验，再原子替换；对旧版本/并发发布须有版本协调。
```

若要同时服务 Environment 查询与业务快照，也须统一它们的应用协议。线程安全的单次替换不自动保证多个对象、连接池和属性源一起完成切换。

## 漏事件、宕机与最后有效版本

通知可降低更新延迟，但不应是唯一真相。应用记录已应用版本，定期对账；发现缺口后拉取完整快照。若远端允许回滚，也应发布一个新的单调版本，而不是把旧版本无声覆盖回来。

监听失败、格式错误或校验失败时保留最后有效版本，记录错误和滞后并重试。启动时是否允许使用可信缓存或默认值由配置重要性决定：安全边界或必需地址缺失可以拒绝启动，非关键功能可以降级。缓存必须有来源与有效策略，“为了应用不挂”不能绕过必要校验。

## 配置并不都能热更

超时和阈值可以较容易以快照读取；连接池、线程池或路由规则可能需重建、排空与关闭旧资源；某些启动配置只能重启生效。为每个字段记录可热更范围、校验和回退方式，避免把所有配置都写成简单字符串替换。

测试覆盖更高优先级覆盖、晚加入来源、@Value 旧值、丢通知、乱序版本、无效快照、远端不可达与更新中的并发读。只有“发布成功”日志，不能证明每个实例已应用新值。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [字节 Agent：任务取消、Spring 配置与并发执行](../../../interview/bytedance/base/bytedance-base-45.md)
<!-- interview-source-history:end -->

## 参考资料

核验于 2026-10-04；Boot 默认来源顺序采用 3.5 文档，Spring API 为 6.2.19。版本对账、快照与最后有效值是本文工程设计，不是文档承诺的自动功能。

- [Spring Boot 3.5：Externalized Configuration](https://docs.spring.io/spring-boot/3.5/reference/features/external-config.html)
- [Spring：MutablePropertySources](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/core/env/MutablePropertySources.html)
- [Spring：Value 注解](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/beans/factory/annotation/Value.html)
