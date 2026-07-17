gRPC 用一份服务定义连接客户端与服务端：在 proto 中声明消息和 RPC，生成 client stub 与 server interface，再通过 HTTP/2 传输二进制 Protobuf。它减少手写序列化和接口漂移，但不会自动解决 deadline、兼容性、认证、重试和业务错误。

[gRPC Introduction](https://grpc.io/docs/what-is-grpc/introduction/)说明，gRPC 常用 Protocol Buffers 作为接口定义语言和消息格式，并从服务定义生成客户端和服务端代码。不同语言 API 风格不同，线上的方法与字段身份仍来自 proto。

![proto 服务和消息经 protoc 生成客户端 Stub 与服务端 Interface，RPC 通过 HTTP/2 传输，并沿调用传播 deadline、metadata、status 和 cancellation](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/grpc-basics-protobuf-call-path-v1.webp)
*图：生成代码提供类型边界，调用的可靠性仍由状态、超时、取消和兼容策略共同决定。*

## 定义服务

~~~proto
syntax = "proto3";

package reports.v1;

service ReportService {
  rpc GetReport(GetReportRequest) returns (Report);
  rpc StreamReport(StreamReportRequest) returns (stream ReportChunk);
}

message GetReportRequest {
  string report_id = 1;
}

message Report {
  string report_id = 1;
  string status = 2;
  bytes content = 3;
}
~~~

package 加版本命名空间，字段使用稳定编号。protoc 配合语言插件生成 stub 和 interface；服务端实现 interface，客户端调用 stub，不需要手写路径和编解码。

## 四种 RPC 生命周期

[gRPC Core Concepts](https://grpc.io/docs/what-is-grpc/core-concepts/)区分 unary、server streaming、client streaming 和 bidirectional streaming。Unary 是一问一答；server streaming 返回多个消息；client streaming 上传一串消息再得到结果；bidirectional 双方独立读写。

流式 RPC 中消息顺序在单一流内保持，但业务仍需序号、终止语义和背压。不要把一个无限双向流当作所有事件的全局总线；连接中断后的重连、游标和去重需要应用协议。

## Metadata、认证与拦截器

Metadata 承载认证、追踪和请求上下文，类似 HTTP Header。服务端拦截器统一完成身份验证、授权、日志、指标和限流。只转发允许列表，不把用户 token 无限制传播给所有下游。

TLS 提供传输保护，服务身份与用户身份仍需证书、令牌或工作负载凭据。授权按具体 service/method/resource 决策，不能因为调用来自内网就信任。

## Deadline 与取消

每个客户端调用显式设置 deadline；没有默认 deadline 可能让请求永久占用线程和连接。服务端读取剩余时间，在不足以完成新工作时快速终止，并把 deadline 传播给下游。排队和重试都消耗同一预算。

客户端取消或 deadline exceeded 后，服务端处理函数应停止子调用、模型流和后台任务。取消不是外部副作用回滚：已提交操作仍通过 operationId 对账。流式处理在循环中检查 context，不要只在入口检查一次。

## Status 与业务错误

gRPC Status 包含标准 code 和 message，可附结构化 details。INVALID_ARGUMENT、NOT_FOUND、ALREADY_EXISTS、PERMISSION_DENIED、RESOURCE_EXHAUSTED、UNAVAILABLE 和 DEADLINE_EXCEEDED 表达不同恢复方式。不要全部返回 INTERNAL，也不要在 message 泄漏堆栈或敏感数据。

业务客户端根据 code 和稳定 detail 判断修正、等待或重试，不能解析自然语言 message。重试只对明确安全的 code、尚未提交的调用和幂等操作生效。

## Protobuf 线协议兼容

[Proto3 Programming Guide](https://protobuf.dev/programming-guides/proto3/)强调字段编号是线上的身份。字段删除后把编号和名称 reserved，不能分配给新语义；否则旧数据可能被误解释。新增可选字段通常向前兼容，旧客户端会忽略未知字段。

危险变更包括改变字段编号、在不兼容类型间切换、改变 oneof 语义、把 repeated 改成 scalar，以及复用已删除编号。源代码能编译不代表 wire-compatible。CI 使用 descriptor set 或 breaking-change 工具与上一发布比较。

枚举第一个值应为 0 且表达 UNSPECIFIED，服务端对未知枚举宽容。不要依赖字段“缺失”和默认零值总能区分；需要 presence 时使用 optional、wrapper 或 oneof，并验证目标语言生成行为。

## 大消息与流控

gRPC 不是传巨大文件的最佳默认方案。设置接收和发送上限，文件走对象存储或受控分块流。HTTP/2 提供连接与流级流控，但应用仍要按消费速度读取，避免把所有 chunk 堆在内存。

一条连接承载大量流，连接级故障会同时影响多个调用。客户端池、keepalive 和连接年龄根据负载测试配置，不能照抄互联网示例。代理与负载均衡器必须正确支持 HTTP/2 和 gRPC trailer。

## 服务发现、健康与负载均衡

健康检查区分进程存活、可接流量和依赖降级。负载均衡可在客户端或代理实现，流式长连接会影响分布。部署摘流时先标记 not serving，停止新 RPC，等待在途调用到安全点，再终止。

## 测试策略

契约测试编译多语言客户端，验证 unary/streaming、未知字段、枚举、deadline、取消、最大消息和 status details。兼容测试让旧客户端调用新服务、新客户端调用旧服务。故障注入覆盖代理断线、半开流、服务端提交后连接丢失和重试。

可观测字段包括 service、method、statusCode、deadline、message counts/bytes、firstMessageLatency、retryAttempt 和 cancellation。不要记录完整消息正文，尤其是 Metadata 中的凭据。

## 小结

gRPC 把 proto 契约生成成多语言调用边界，并通过 HTTP/2 支持 unary 与流式通信。生产可用性取决于显式 deadline、协作取消、稳定 Status、Metadata 安全、流控和字段编号兼容。生成代码减少样板，但不会替代协议设计。

## 参考资料

- [gRPC：Introduction](https://grpc.io/docs/what-is-grpc/introduction/)
- [gRPC：Core concepts, architecture and lifecycle](https://grpc.io/docs/what-is-grpc/core-concepts/)
- [Protocol Buffers：Proto3 Language Guide](https://protobuf.dev/programming-guides/proto3/)
