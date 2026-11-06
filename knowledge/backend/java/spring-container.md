Spring 容器把“对象如何创建、依赖如何装配、生命周期由谁管理”集中表达为 Bean 定义。BeanFactory 提供基础工厂合同；ApplicationContext 在其之上集成资源、事件、国际化和环境等应用能力。两者是接口与实现的层次关系，不是两种互斥框架。

## 为什么区分定义与实例

Bean 定义是创建配方，实例是运行中的对象。同一类型可以有多个定义，作用域决定定义如何对应实例。因此 Spring singleton 表示每容器、每定义的一份实例，并非进程里某个类绝对只有一个对象。[Spring 6.2 Bean Scopes](https://docs.spring.io/spring-framework/reference/6.2/core/beans/factory-scopes.html)说明 singleton 与 prototype 等作用域。

![配置形成 Bean 定义，ApplicationContext 提供工厂访问与应用级服务，Bean 实例和事件监听分别按容器合同工作](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/spring-container-archify-v1.png)

## 接口关系怎样读

BeanFactory 定义 `getBean`、类型判断等基础能力。ApplicationContext 直接扩展 ListableBeanFactory、HierarchicalBeanFactory、EnvironmentCapable、MessageSource、ApplicationEventPublisher 和 ResourcePatternResolver；经接口继承再获得 BeanFactory 与 ResourceLoader 等合同。[6.2.19 ApplicationContext API](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/ApplicationContext.html)可以核对准确声明。

Listable 表达枚举或按类型查询，Hierarchical 表达父子容器查找，ResourcePatternResolver 提供资源模式解析。事件发布与国际化也是独立能力；它们不改变业务对象仍需定义依赖和生命周期的事实。

## 懒加载与预实例化并非绝对二分

常见 ApplicationContext 刷新时会预实例化非懒加载 singleton，以便较早发现依赖问题；但 lazy 配置等会改变时机。BeanFactory 的合同也不能简单概括成“所有 Bean 必定到 getBean 才创建”。要看所用实现、作用域和配置，而不是只背一个对比表。[BeanFactory API](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/beans/factory/BeanFactory.html)强调工厂访问与生命周期合同。

构造注入让必需依赖显式化，便于测试；装配阶段解析依赖并执行适用的初始化和后处理。工厂可能返回经过代理的对象，不能假定 `getBean` 的结果一定是原始实例。

## 作用域与资源释放

singleton 是共享实例，业务可变状态需要自己的并发设计，容器不会自动让它线程安全。prototype 每次请求该定义可创建新实例，但注入 singleton 时通常只取得当时那一份；若每次操作需要新对象，应使用恰当的 provider 或查找机制。

prototype 的完整销毁责任不由容器自动接管，使用方必须释放它持有的资源。request、session 等作用域还依赖相应 Web 环境，不是任意基础工厂都可以直接使用。[Spring 6.2 作用域文档](https://docs.spring.io/spring-framework/reference/6.2/core/beans/factory-scopes.html)界定这些边界。

## 从数据库预加载缓存，先决定需要哪个完成边界

“Spring 初始化时查数据库写缓存”不只有一个扩展点。先确认预热只依赖当前 Bean 的配置，还是需要常规 singleton 及其代理已经可用；再确认缓存缺失是否允许接流量。选择回调解决的是执行时机，数据库可用、预热成功和业务就绪仍是不同条件。下面是独立教学设计，不代表某份面经里的项目实际采用了这些方案。

| 扩展点 | 合适的工作与时机 | 主要边界 |
|---|---|---|
| `@PostConstruct`、InitializingBean.afterPropertiesSet、配置的 init 方法 | 依赖注入后的单 Bean 校验与本地数据结构准备 | 当前 Bean 仍处在初始化过程，不宜承担耗时的跨 Bean 数据库预热 |
| SmartInitializingSingleton.afterSingletonsInstantiated | 常规 singleton 预实例化结束后执行一次阶段性准备 | 不代表所有 lazy Bean 或其他作用域实例都已创建 |
| ContextRefreshedEvent 监听器 | 上下文完成初始化或刷新后触发工作 | 区分所属上下文，处理可能的再次刷新，避免重复执行 |
| Spring Boot 的 ApplicationRunner / CommandLineRunner | 容器刷新后执行有界启动任务，并在返回前确认所需准备完成 | 属于 Boot 扩展，不是所有 Spring 容器都具有；异步发出任务不等于等待完成 |

[Spring Framework 6.2.19 生命周期说明](https://github.com/spring-projects/spring-framework/blob/v6.2.19/framework-docs/modules/ROOT/pages/core/beans/factory-nature.adoc)指出，单 Bean 初始化回调在 singleton 创建锁内执行，应限制为配置校验或本地准备；耗时的初始化后活动可转向 SmartInitializingSingleton 或刷新事件。初始化回调针对原始 Bean，AOP 拦截尚未应用到该 Bean；不能期待给初始化方法加上事务注解，就自动经过自己的事务代理。需要事务时，应在恰当后期阶段调用已完成装配的独立事务服务，并验证实际代理边界。

生命周期先后也不能省略限定。SmartInitializingSingleton 只保证常规 singleton 已创建，不覆盖启动后按需创建的 lazy singleton，也不覆盖其他作用域；[它的官方合同](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/beans/factory/SmartInitializingSingleton.html)对此有明确限制。刷新事件则需要考虑上下文层级和实现是否支持再次刷新；不是每个 ApplicationContext 都能反复 refresh。[Spring 6.2.19 事件说明](https://github.com/spring-projects/spring-framework/blob/v6.2.19/framework-docs/modules/ROOT/pages/core/beans/context-introduction.adoc)区分了这些事件。

下图按常规 singleton 的正常启动路径说明回调位置，最后一段仅在使用 Boot 时适用。一次预热选择合适的扩展点即可，不应把相同查询挂到图中的每个节点。

![容器先对 Bean 构造注入、本地初始化和后处理，常规单例预实例化完成后进入刷新事件阶段；若使用 Boot，Runner 成功返回后才发布就绪事件和可接流量状态](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/spring-container-cache-preload-archify-v2.png)
*图：这些是容器、Bean 回调和 Boot 的职责角色与正常先后。回调按需求选择，Boot 分支有明确前提；不能把异步任务已提交当成预热完成。*

在 [Spring Boot 3.5.16 的启动合同](https://github.com/spring-projects/spring-boot/blob/v3.5.16/spring-boot-project/spring-boot-docs/src/docs/antora/modules/reference/pages/features/spring-application.adoc)中，ApplicationStartedEvent 位于上下文刷新后、Runner 前；ApplicationReadyEvent 在 Runner 执行后，随后发布 ACCEPTING_TRAFFIC 就绪状态。必需缓存可选择 Runner 中有界等待并传播失败。仍须让实际流量入口遵守 readiness：不能仅因端口已经监听就断言业务准备完成，也不能把所有缓存都认定为必须阻塞启动。

## 预热成功怎样定义，失败怎样处理

以下协议伪代码只说明决策，不是已经运行的 Spring 示例：

```text
在选定的启动扩展点：
  确认数据库及必需依赖已经可用
  在明确的查询范围、容量与时间预算内构造候选缓存快照
  校验候选数据完整性，再按读写双方约定的并发协议发布
  必需数据失败：传播启动失败或保持不可接流量，记录原因
  可选数据失败：按既定回源/降级方案运行，记录未预热状态
```

不要逐条覆盖共享缓存、只填到一半就宣告成功。先构造候选快照再发布，可以让读者避免观察半成品，但发布仍需一致的并发协议；单纯赋值、改用并发 Map 或把方法标注为异步，都不自动保证业务完整性。还要定义数据版本、刷新/失效、并发重复触发和多实例各自预热的成本，这些是应用设计选择，不是容器回调替你提供的保证。

如果预热必须后台持续运行，就明确初始就绪条件、失败重试、取消和关闭，按需求使用 Lifecycle/SmartLifecycle 管理运行阶段，而不是在初始化回调里创建一个无人管理的线程。超时也要落到实际数据库调用或任务取消合同中；外层“不再等待”不必然停止后台工作。验证时分别观察查询失败、超时、重复触发、读者看不到半成品、就绪状态和关闭后的任务停止。

## 验证一项容器设计

用两个定义与两种作用域验证实例身份；检查构造依赖缺失时的失败；验证初始化与关闭回调是否执行；再对有状态 singleton 做并发测试。事件、配置和资源能力分别验证，不以“应用成功启动”证明所有合同。

例如订单服务依赖库存接口时，先用假实现验证服务，再用真实容器检查装配。业务单测和容器装配测试关注不同问题，不应为了测试简单逻辑每次启动整个应用。这里给的是测试设计，没有声称已运行 Java/Spring 示例。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [商盟支付 Java 开发实习一面：交易去重、并发与消息](../../../interview/shangmeng/ai/shangmeng-ai-1.md)
- [字节 Agent：任务取消、Spring 配置与并发执行](../../../interview/bytedance/base/bytedance-base-45.md)
<!-- interview-source-history:end -->

## 参考资料

核验于 2026-10-04；本文接口声明采用 Spring Framework 6.2.19，参考指南固定 6.2 分支。

- [Spring：BeanFactory API](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/beans/factory/BeanFactory.html)
- [Spring：ApplicationContext API](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/ApplicationContext.html)
- [Spring 6.2：Bean Scopes](https://docs.spring.io/spring-framework/reference/6.2/core/beans/factory-scopes.html)
- [Spring Framework 6.2.19：Bean 初始化、代理与创建锁边界](https://github.com/spring-projects/spring-framework/blob/v6.2.19/framework-docs/modules/ROOT/pages/core/beans/factory-nature.adoc)（缓存预加载增补于 2026-11-06 核验）
- [Spring Framework 6.2：SmartInitializingSingleton 回调合同](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/beans/factory/SmartInitializingSingleton.html)
- [Spring Framework 6.2.19：上下文事件与刷新边界](https://github.com/spring-projects/spring-framework/blob/v6.2.19/framework-docs/modules/ROOT/pages/core/beans/context-introduction.adoc)
- [Spring Boot 3.5.16：Runner、启动事件与就绪](https://github.com/spring-projects/spring-boot/blob/v3.5.16/spring-boot-project/spring-boot-docs/src/docs/antora/modules/reference/pages/features/spring-application.adoc)
