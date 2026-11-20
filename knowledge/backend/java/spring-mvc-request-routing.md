一个 HTTP 请求进入控制器，经历了网络接收、Servlet 分派、请求匹配和方法调用几个不同层次。Spring MVC 用 DispatcherServlet 统一组织后面几项，再把具体策略交给 HandlerMapping 和 HandlerAdapter；理解它们的分工，比只记“URL 查 Map”更能解释框架怎样通用地调用业务代码。

本文以 **Spring Framework 6.2 的 Servlet 栈、注解式控制器和普通同步请求**为范围，源码固定在 6.2.19；不把可滚动的最新版文档默认值套回所有 Spring Boot 项目。WebFlux 使用另一套响应式入口，异步请求还可能挂起后再次分派，不应硬套本节同步链路。

## 请求先到哪里

客户端按目标主机、端口和协议把请求发到服务器；若有网关或反向代理，还先经过对应转发。Servlet 容器接收并解析 HTTP，形成请求与响应对象，执行适用的 Filter 链，再按 Servlet 映射交给 DispatcherServlet。Spring Boot 常为应用配置这些基础设施，但“Boot”不是一个把全部流量直接反射到方法的路由器。[DispatcherServlet 官方说明](https://docs.spring.io/spring-framework/reference/6.2/web/webmvc/mvc-servlet.html)

这里有两层映射：容器先选择 Servlet；进入 MVC 后，HandlerMapping 才选择业务处理器。Filter 可提前结束请求，安全链也可能拒绝访问，因此到达服务器并不保证控制器必然被调用。

## 启动时：把声明变成可匹配的处理器

普通注解控制器先作为 Spring Bean 被发现。RequestMappingHandlerMapping 读取类和方法上的映射声明，把路径、HTTP 方法、参数、请求头和媒体类型等条件，与具体 Bean 及方法关联起来。`@GetMapping` 是针对 GET 的组合映射注解，类级路径与方法级路径可以组合。[6.2 请求映射文档](https://docs.spring.io/spring-framework/reference/6.2/web/webmvc/mvc-controller/ann-requestmapping.html)、[6.2.19 映射实现](https://github.com/spring-projects/spring-framework/blob/v6.2.19/spring-webmvc/src/main/java/org/springframework/web/servlet/mvc/method/annotation/RequestMappingHandlerMapping.java)

因此，映射目标通常是**某个 Bean 上的某个方法**，不仅是一个类名。同一路径的 GET 和 POST 可以进入不同方法，`/orders/{id}` 还需要模式匹配与路径变量提取；只做 `Map<String, Class>` 既没有表达全部条件，也没有解决参数和返回值的通用处理。

## 请求时：先找处理器，再适配调用

以下是正常同步请求的主干；拦截器、错误处理和提前返回会改变路径。

![Servlet 容器把请求交给 DispatcherServlet，后者先经 HandlerMapping 找处理器，再让 HandlerAdapter 解析参数并调用控制器；控制器返回值经消息转换写回响应](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/spring-mvc-request-routing-dispatch-v1.dark.png)
*图：HandlerMapping 回答“调用谁”，HandlerAdapter 回答“如何调用”；DispatcherServlet 负责组织两者，箭头不表示它们直接互相调用。*

1. DispatcherServlet 查询配置的 HandlerMapping，取得处理器及适用拦截器组成的执行链；注解式控制器通常对应一个 HandlerMethod。
2. DispatcherServlet 选择支持该处理器的 HandlerAdapter。适配器屏蔽处理器形式的差异，使总入口不必为每种控制器另写一套调用逻辑。
3. 在拦截器允许继续的前提下，适配器为方法准备参数，例如读取路径变量、转换查询参数、通过 HttpMessageConverter 读取请求体，再调用目标 Bean 的方法。
4. 返回值按对应处理器处理。`@RestController` 包含 `@ResponseBody` 语义，返回对象可经消息转换器写到响应体；普通 MVC 也可以返回逻辑视图名并解析渲染视图。

[特殊 Bean 的职责](https://docs.spring.io/spring-framework/reference/6.2/web/webmvc/mvc-servlet/special-bean-types.html)定义了映射与适配的分工；[方法参数文档](https://docs.spring.io/spring-framework/reference/6.2/web/webmvc/mvc-controller/ann-methods/arguments.html)说明路径、查询和请求体的不同来源；[ResponseBody 文档](https://docs.spring.io/spring-framework/reference/6.2/web/webmvc/mvc-controller/ann-methods/responsebody.html)说明响应体转换。

映射、参数转换、业务执行、响应转换都可能失败，适用异常会交给 HandlerExceptionResolver 等机制处理。没有匹配路径、HTTP 方法不允许、参数类型不合法是不同失败原因；排查时先确定停在哪一步，不应看到错误响应就断言业务方法已执行。[6.2.19 DispatcherServlet 的分派实现](https://github.com/spring-projects/spring-framework/blob/v6.2.19/spring-webmvc/src/main/java/org/springframework/web/servlet/DispatcherServlet.java)

## 一个小例子：同一路径的两种请求

下面是教学片段，省略应用启动配置与 import，没有声称已在这里启动 Spring 服务：

```java
@RestController
@RequestMapping("/orders")
class OrderController {
    @GetMapping("/{id}")
    public Map<String, Object> get(@PathVariable("id") long id) {
        return Map.of("id", id, "status", "demo");
    }

    @PostMapping("/{id}")
    public Map<String, Object> update(@PathVariable("id") long id) {
        return Map.of("id", id, "updated", true);
    }
}
```

`GET /orders/42` 与 `POST /orders/42` 路径相同，却因方法条件进入不同 Java 方法。`id` 从路径中提取并转换为 long；若传入非数字，参数转换阶段就可能失败。示例只返回演示数据，不代表存在数据库更新。

这两个方法没有通过继承某个业务基类来获得路由身份。注解控制器声明映射，框架读取元数据并组织调用；Spring 也支持其他处理器合同，但不能据此认定所有业务控制器必须继承一个统一基类。Bean 的创建与依赖装配是另一项职责，可先读 [Spring 容器](spring-container.md)。

## 如果自己设计一个最小分派器

可以先定义请求匹配条件和处理器描述，再分别实现注册、匹配、参数解析、调用与返回值写出；它是一个简化的教学设计，不是对 Spring 内部全部实现的复刻。

注册阶段读取显式配置或注解，建立“匹配条件 → 对象与方法”关系并处理冲突；请求阶段选择匹配项，按统一适配合同绑定参数并调用。直接路径可用索引加速，但路径模式、优先级、媒体类型和歧义检查仍需规则；反射只解决调用手段的一部分，不会自动完成这些协议。

通用性来自稳定的处理器与适配合同、元数据和可替换策略。基类继承可以是某种自设计方案，但不是注解式 MVC 路由必需的前提。是否采用反射、方法句柄或其他调用机制，也要结合所模拟的版本与约束说明，不把“框架用了反射”当作完整答案。

## 怎样验证这条链路

在实际项目中先固定 Boot/Framework 版本与 MVC/WebFlux 栈，再检查控制器是否成为 Bean、映射是否注册、HTTP 方法与路径是否匹配、参数是否绑定成功。分别发起正常请求、同路径不同方法、无匹配路径和非法路径参数请求，观察是否进入业务方法及最终响应；认证 Filter 与拦截器还应分别验证提前返回。这是验证建议，本文没有运行这些请求。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [腾讯游戏安全后台一面：进程、Agent 与请求路由](../../../interview/tencent/ai/tencent-ai-34.md)
<!-- interview-source-history:end -->

## 参考资料

- [Spring Framework 6.2：DispatcherServlet](https://docs.spring.io/spring-framework/reference/6.2/web/webmvc/mvc-servlet.html)
- [Spring Framework 6.2：特殊 Bean 策略职责](https://docs.spring.io/spring-framework/reference/6.2/web/webmvc/mvc-servlet/special-bean-types.html)
- [Spring Framework 6.2：请求映射条件](https://docs.spring.io/spring-framework/reference/6.2/web/webmvc/mvc-controller/ann-requestmapping.html)
- [Spring Framework 6.2：控制器方法参数](https://docs.spring.io/spring-framework/reference/6.2/web/webmvc/mvc-controller/ann-methods/arguments.html)
- [Spring Framework 6.2：ResponseBody 与消息转换](https://docs.spring.io/spring-framework/reference/6.2/web/webmvc/mvc-controller/ann-methods/responsebody.html)
- [Spring Framework 6.2.19：RequestMappingHandlerMapping 源码](https://github.com/spring-projects/spring-framework/blob/v6.2.19/spring-webmvc/src/main/java/org/springframework/web/servlet/mvc/method/annotation/RequestMappingHandlerMapping.java)
- [Spring Framework 6.2.19：DispatcherServlet 源码](https://github.com/spring-projects/spring-framework/blob/v6.2.19/spring-webmvc/src/main/java/org/springframework/web/servlet/DispatcherServlet.java)
