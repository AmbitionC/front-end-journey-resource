装饰器模式用对象组合扩展职责：包装器与被包装对象遵守同一接口，包装器持有内部对象，将工作委托给它，再在调用前后增加行为。学习重点是“同接口、持有对象、委托与组合”，不能只凭一个 `@` 符号或类名中出现 Decorator 判断模式。

## 为什么用组合增加职责

假设一个文本读取器原本只返回文本，现在部分调用需要转大写，部分需要增加前缀，还有些同时需要两者。为每种组合创建一个子类，组合增加时会出现许多相近类型。包装对象可以把这些职责拆开，再按需求组装；具体包装器仍可通过实现接口或继承公共基类取得共同合同，区别在于职责组合不必固定在一条业务继承链里。

这个想法有真实的标准库对应物。[Java 21 的 FilterInputStream](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/FilterInputStream.html)继承 InputStream，同时持有另一个 InputStream；其基本实现将请求转给内部流，子类可改变数据处理或增加能力。这能验证包装与委托的机制，不代表任意两种流交换顺序都合法。

## 四个角色怎样配合

共同接口描述客户端需要的操作；具体组件提供基础实现；包装器也满足该接口并持有同接口对象；客户端面向共同接口工作。下图展示具体对象之间的持有关系，箭头表示调用入口或内部委托，不表示类继承。

![客户端通过TextReader接口调用PrefixReader，PrefixReader持有并委托给UpperReader，UpperReader再持有并委托给TextSource；三个对象都提供read方法](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/decorator-pattern-composition-v1.png)
*图：两层包装器各持有一个 `inner: TextReader`。客户端使用同一接口，额外行为来自对象组合；这是教学设计，不是某个面试项目的真实结构。*

## 一个可推演的小例子

下面是教学伪代码，用于解释对象关系：

```text
TextReader: read() -> string

TextSource.read(): 返回 "ok"
UpperReader(inner).read(): 返回 upper(inner.read())
PrefixReader(inner).read(): 返回 "log:" + inner.read()

reader = PrefixReader(UpperReader(TextSource))
reader.read() 的结果为 "log:OK"
```

`PrefixReader` 先把读取委托给 `UpperReader`，后者取得源文本并转成大写；结果返回外层后才添加小写前缀。若改成 `UpperReader(PrefixReader(TextSource))`，结果是 `"LOG:OK"`。两个组合拥有相同接口，但附加行为的先后不同，因此组装顺序是设计合同的一部分。

不要由同接口推出完全相同的业务含义。若包装器会缓存、重试、写日志或关闭资源，就要定义缓存新鲜度、允许重试的副作用、日志隐私及资源所有权。尤其不能让每一层都擅自重试一次，最后把调用数量成倍放大。

## 与语法装饰器、代理有什么区别

| 概念 | 主要关注点 | 怎样辨认 |
| --- | --- | --- |
| 对象结构型装饰器模式 | 通过组合逐层增加对象职责 | 包装器与组件共用接口，持有并委托给内部对象 |
| Python 装饰器语法 | 在定义时转换函数或类 | `@decorator` 表达可调用对象的应用，不要求形成上述对象结构 |
| TypeScript 装饰器机制 | 定制类及其成员的行为或初始化 | 依赖所用版本与装饰器模型，不由语法自动保证共同接口与逐层委托 |
| 代理模式 | 常见意图是控制对象访问、定位或创建等间接性 | 结构可能也含包装与委托，要结合设计目的判断，不能只看转发代码 |

[Python 官方 glossary](https://docs.python.org/3/glossary.html#term-decorator)用函数变换解释 `@` 语法；[TypeScript 5.0 的官方说明](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html#decorators)展示了方法替换和初始化定制。这里用它们区分语言机制，不能把 TypeScript 的不同装饰器版本混用。语法装饰器可以参与实现附加行为，但名字相同不等于必然采用同一种结构型模式。

代理与装饰器也不是互斥的代码形状。一个包装类可能同时承担访问控制与附加职责；回答时应说明主要目的及调用路径。JDK 动态代理是实现间接调用的一种机制，具体入口与限制见[Java 动态代理](../java/java-dynamic-proxy.md)，不能把“动态生成代理”当成所有装饰器的实现要求。

## 顺序、复杂度与调试边界

若有 k 层包装，每层恰好委托一次且自身开销为常数，一次调用增加 O(k) 的调度开销；真实总耗时还取决于内部读取、转换、网络或重试。多个文本转换会扫描或复制数据，不能仅由层数声称性能更好。

层数增加会让异常来源、资源关闭与状态归属更难追踪。保持每层职责单一，明确输入输出和异常合同，并记录必要的包装链。验证时比较不包装、单层包装、两种不同顺序、内部失败和资源释放；这些是验证维度，不能把类型检查通过当成所有组合都正确。

适合采用装饰器的前提，是这些附加职责确实可以在共同合同下独立组合。如果每层都需要窥探内部具体类型、随意修改其他层状态，或者组合只能按一套固定流程运行，应重新检查抽象与组装方式。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [快手 Agent 开发二面关联题单：Hooks、锁与设计模式](../../../interview/kuaishou/ai/kuaishou-ai-22.md)
<!-- interview-source-history:end -->

## 参考资料

- [Java SE 21：FilterInputStream 的包装、内部引用与委托合同](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/FilterInputStream.html)
- [Python glossary：decorator](https://docs.python.org/3/glossary.html#term-decorator)
- [TypeScript 5.0：Decorators](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html#decorators)
