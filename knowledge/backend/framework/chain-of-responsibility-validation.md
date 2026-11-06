责任链把一个请求沿着一组处理器传递，让控制流程与具体规则实现分离。先明确控制合同：有的链由某个处理器接管请求，有的链要求所有规则通过；不能把“连成一串”误认为这些语义天然相同。

本文以业务校验为例，讨论按顺序检查、失败短路、全部通过后再进入写入阶段的规则管线。节点和场景都是教学假设，不代表任何面试原帖的实际实现。

## 从一个大方法到明确规则

当校验包含输入格式、身份、资源状态和业务资格时，全部堆在一个业务方法中，往往难以说明顺序、测试每条规则和复用失败结果。可以把规则拆成小处理器，每个处理器读取必要上下文并返回明确结果，由链控制是否继续。

拆分有成本：处理器之间可能存在顺序依赖，共享上下文可能变成隐藏的可变状态，过多小类也可能让简单流程难以跟踪。规则少而稳定时，清晰的普通条件判断同样合理。

## 控制权与“下一步”

[Jakarta Servlet 6.1 的 FilterChain](https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/FilterChain.html)提供了一个明确的控制例子：调用 `doFilter` 才进入下一个过滤器或末端资源。该 API 说明的是具体框架的调用合同，并不证明所有责任链都必须使用相同接口。

设计自己的链时，至少要说清处理器能否终止、是否允许跳过后续规则、能否重复调用下一步、是否有前后置逻辑，以及错误由谁转成稳定结果。本文的校验管线采用“第一条失败即停止；全部通过才继续”的语义。

![只读输入校验和业务规则通过后，进入事务内重新核对并幂等写入，任一失败返回明确错误](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/chain-of-responsibility-validation-gates-archify-v1.png)
*图：链中通过只代表本次校验成立，权威写入仍须处理状态变化与并发。*

## 一个最小的校验管线

下面用普通 JavaScript 表达规则，不依赖框架。教学上下文中的时间都是同单位的可信时间戳；实际规则、顺序和错误码应由业务合同决定。

```javascript
function validate(ctx, rules) {
  for (const rule of rules) {
    const result = rule(ctx);
    if (!result.ok) return result;
  }
  return { ok: true };
}

const rules = [
  ctx => ctx.coupon
    ? { ok: true }
    : { ok: false, code: "COUPON_NOT_FOUND" },
  ctx => ctx.now < ctx.coupon.expireAt
    ? { ok: true }
    : { ok: false, code: "COUPON_EXPIRED" },
  ctx => ctx.userId === ctx.coupon.ownerId
    ? { ok: true }
    : { ok: false, code: "NOT_ELIGIBLE" },
];
```

第一条失败后不会继续解引用不存在的优惠券。示例刻意把读判断与副作用分开，不在中间规则里扣库存、发送成功消息或核销权益。数组循环是一种规则管线实现；也可用对象中的 `next` 表达链接，关键在于继续与终止的合同可被验证。

## 失败短路与累计错误是不同策略

短路适合前置条件成立后才能检查下一项的流程，例如没有资源就不能读取其有效期。累计错误适合彼此独立、希望一次性反馈的输入字段，但不能为了凑齐错误继续执行依赖缺失状态的节点。

对外错误还要考虑信息边界和稳定性：是否先暴露资源存在性、资格规则是否应统一反馈，不能仅按代码书写方便决定。记录规则 ID、版本、耗时和失败类别即可支持定位，不必在日志中复制敏感上下文。

## 为什么链不能代替事务与幂等

校验与写入之间可能发生状态变化。优惠券在校验时未到期，核销时可能已过期；两个请求也可能同时通过“尚未领取”的判断。因此写入阶段还须基于当前权威时间和状态执行条件更新或事务，并用业务幂等键约束重复执行。

需要读外部状态的规则，应明确读取版本、超时与失败策略。校验结果不能自动充当长期授权票据，客户端声明或旧缓存也不能替代服务端的最终判断。消息延迟与补偿处理可参照[异步任务与消息队列](../api/async-job-queue.md)。

## 与相邻概念的边界

Schema 校验主要说明输入的形状、类型及契约；业务规则还可能涉及资格、当前状态和权限。洋葱式中间件强调进入与返回时的嵌套顺序，本文的纯校验循环则没有隐含的回程逻辑。相关前置知识见[API Schema 校验](../api/api-schema-validation.md)与[请求上下文和洋葱模型](./koa-middleware.md)。

测试应覆盖每个规则、顺序依赖、失败后不继续、全部通过、状态变化以及真实写入的并发与幂等。一个规则单测通过，不代表整条业务链在生产环境中正确。

## 工厂、策略与责任链：先识别变化的职责

介绍模式时，先说明希望隔离什么变化，再说明对象或函数怎样协作。三种常见职责可以放在同一个业务例子里比较，但不必为了凑齐模式把简单流程拆成许多层。

| 关注的变化 | 选择思路 | 导出业务的教学例子 | 需要守住的边界 |
|---|---|---|---|
| 创建哪种对象、如何配置它 | 工厂：分开对象创建与使用 | 按获准格式创建并配置 PDF 或 CSV 导出器 | 工厂负责创建，不自动定义业务步骤的先后 |
| 同一职责有多套可替换算法 | 策略：通过共同合同选择一种行为 | 选用一套已授权的脱敏策略 | 一次选用一种策略，不等于必须遍历所有策略 |
| 一个请求经过哪些处理器、何时停止 | 责任链或规则管线：明确传递与终止 | 按格式、权限、资源状态逐项校验，失败短路 | 有的链由一个处理器接管，有的要求全部通过，应先说明控制合同 |

JDK 21 的 [`DocumentBuilderFactory.newInstance()`](https://docs.oracle.com/en/java/javase/21/docs/api/java.xml/javax/xml/parsers/DocumentBuilderFactory.html#newInstance())通过查找机制得到工厂实现，调用方再用工厂配置并取得解析器。这可以说明创建与使用的分离；这里使用“工厂”这个职责概念，不把所有工厂 API 都直接归成同一个具体的 GoF 创建型模式。

JDK 21 的 [`Comparator`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Comparator.html)允许把比较规则传给排序方法，以控制排序顺序。这可作为可替换行为的策略式教学例子；规则仍须满足比较合同，不是只要写了接口或 lambda 就自动形成一个合适的策略设计。责任链的具体调用例子则是前述 Servlet `FilterChain.doFilter`：是否调用下一环节，直接影响流程是否继续。

三者可以组合：工厂创建选定的策略对象，规则链在明确位置使用它；但“创建对象”“选择一种算法”“让请求按合同传递”解决的是不同问题。普通条件判断在规则少且稳定时仍很合适。描述真实项目时，还应给出实际变化点、调用路径和替换成本，不能仅根据类名含 Factory、Strategy 或 Handler 就认定实现已经符合相应模式。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [商盟支付 Java 开发实习一面：交易去重、并发与消息](../../../interview/shangmeng/ai/shangmeng-ai-1.md)
- [快手效果营销实习一面：意图路由、模型容错与业务校验](../../../interview/kuaishou/ai/kuaishou-ai-18.md)
<!-- interview-source-history:end -->

## 参考资料

- [Jakarta Servlet 6.1：FilterChain 的下一处理器调用合同](https://jakarta.ee/specifications/servlet/6.1/apidocs/jakarta.servlet/jakarta/servlet/FilterChain.html)。
- [JDK 21：DocumentBuilderFactory 的创建、查找与解析器配置](https://docs.oracle.com/en/java/javase/21/docs/api/java.xml/javax/xml/parsers/DocumentBuilderFactory.html)
- [JDK 21：Comparator 的可替换比较合同](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Comparator.html)

