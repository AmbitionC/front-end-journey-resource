Spring 容器把“对象如何创建、依赖如何装配、生命周期由谁管理”集中表达为 Bean 定义。BeanFactory 提供基础工厂合同；ApplicationContext 在其之上集成资源、事件、国际化和环境等应用能力。两者是接口与实现的层次关系，不是两种互斥框架。

## 为什么区分定义与实例

Bean 定义是创建配方，实例是运行中的对象。同一类型可以有多个定义，作用域决定定义如何对应实例。因此 Spring singleton 表示每容器、每定义的一份实例，并非进程里某个类绝对只有一个对象。[Spring 6.2 Bean Scopes](https://docs.spring.io/spring-framework/reference/6.2/core/beans/factory-scopes.html)说明 singleton 与 prototype 等作用域。

<iframe
  src="/archify/spring-container.html"
  title="配置形成 Bean 定义，ApplicationContext 提供工厂访问与应用级服务，Bean 实例和事件监听分别按容器合同工作"
></iframe>

## 接口关系怎样读

BeanFactory 定义 `getBean`、类型判断等基础能力。ApplicationContext 直接扩展 ListableBeanFactory、HierarchicalBeanFactory、EnvironmentCapable、MessageSource、ApplicationEventPublisher 和 ResourcePatternResolver；经接口继承再获得 BeanFactory 与 ResourceLoader 等合同。[6.2.19 ApplicationContext API](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/ApplicationContext.html)可以核对准确声明。

Listable 表达枚举或按类型查询，Hierarchical 表达父子容器查找，ResourcePatternResolver 提供资源模式解析。事件发布与国际化也是独立能力；它们不改变业务对象仍需定义依赖和生命周期的事实。

## 懒加载与预实例化并非绝对二分

常见 ApplicationContext 刷新时会预实例化非懒加载 singleton，以便较早发现依赖问题；但 lazy 配置等会改变时机。BeanFactory 的合同也不能简单概括成“所有 Bean 必定到 getBean 才创建”。要看所用实现、作用域和配置，而不是只背一个对比表。[BeanFactory API](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/beans/factory/BeanFactory.html)强调工厂访问与生命周期合同。

构造注入让必需依赖显式化，便于测试；装配阶段解析依赖并执行适用的初始化和后处理。工厂可能返回经过代理的对象，不能假定 `getBean` 的结果一定是原始实例。

## 作用域与资源释放

singleton 是共享实例，业务可变状态需要自己的并发设计，容器不会自动让它线程安全。prototype 每次请求该定义可创建新实例，但注入 singleton 时通常只取得当时那一份；若每次操作需要新对象，应使用恰当的 provider 或查找机制。

prototype 的完整销毁责任不由容器自动接管，使用方必须释放它持有的资源。request、session 等作用域还依赖相应 Web 环境，不是任意基础工厂都可以直接使用。[Spring 6.2 作用域文档](https://docs.spring.io/spring-framework/reference/6.2/core/beans/factory-scopes.html)界定这些边界。

## 验证一项容器设计

用两个定义与两种作用域验证实例身份；检查构造依赖缺失时的失败；验证初始化与关闭回调是否执行；再对有状态 singleton 做并发测试。事件、配置和资源能力分别验证，不以“应用成功启动”证明所有合同。

例如订单服务依赖库存接口时，先用假实现验证服务，再用真实容器检查装配。业务单测和容器装配测试关注不同问题，不应为了测试简单逻辑每次启动整个应用。这里给的是测试设计，没有声称已运行 Java/Spring 示例。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [字节 Agent：任务取消、Spring 配置与并发执行](../../../interview/bytedance/base/bytedance-base-45.md)
<!-- interview-source-history:end -->

## 参考资料

核验于 2026-10-04；本文接口声明采用 Spring Framework 6.2.19，参考指南固定 6.2 分支。

- [Spring：BeanFactory API](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/beans/factory/BeanFactory.html)
- [Spring：ApplicationContext API](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/ApplicationContext.html)
- [Spring 6.2：Bean Scopes](https://docs.spring.io/spring-framework/reference/6.2/core/beans/factory-scopes.html)
