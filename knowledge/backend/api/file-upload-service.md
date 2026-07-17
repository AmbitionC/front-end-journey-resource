大文件上传不应让应用服务器先完整接收再转发对象存储。更可扩展的方式是：应用创建受限上传会话和 PENDING 元数据，客户端使用短时预签名直接上传各 part，对象存储记录校验信息，客户端提交完成请求后，应用验证完整性与内容，最后才把文件标记 READY。

[Amazon S3 Multipart Upload Overview](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html)将流程分为 initiate、upload parts、complete 或 abort，并用 upload ID 标识一次上传。这里用 S3 作为具体实现例子，其他对象存储的限制、ETag 和校验语义需要查其官方契约。

![客户端先获取受限上传会话，再将多个分片直传对象存储并维护 part 校验账本；Complete 后经过完整性、类型与恶意内容检查才进入 READY](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/file-upload-service-multipart-object-flow-v1.webp)
*图：READY 只能由服务端验证流程写入，客户端完成上传不等于文件已经可安全使用。*

## 领域状态与身份

一个上传会话至少包含：

~~~json
{
  "uploadSessionId": "upl_01J...",
  "tenantId": "t_7",
  "objectKey": "tenant/t_7/uploads/upl_01J...",
  "state": "pending",
  "uploadId": "provider-upload-id",
  "expectedSize": 734003200,
  "partSize": 16777216,
  "expectedChecksum": "sha256:...",
  "contentTypeClaim": "video/mp4",
  "expiresAt": "2026-07-17T05:00:00Z",
  "version": 1
}
~~~

对象 key 由服务端生成并绑定租户，客户端不能选择任意路径。文件名只作为展示元数据，经过规范化和长度限制；不能参与磁盘路径或权限判断。状态可为 pending、uploading、processing、ready、rejected、aborted 和 expired。

## 创建受限会话

应用验证身份、配额、文件大小、业务用途和允许类型，再调用对象存储 initiate。返回 uploadSessionId、partSize、part 数上限、过期时间和按需签发 part URL 的接口。预签名限制 bucket/key、partNumber、uploadId、方法、内容长度和较短有效期。

不要一次生成数万个长期 URL；客户端按窗口获取，既降低泄露面也便于撤销。会话取消或用户权限撤回后，应用停止签发新 URL，并调用 abort。

## 分片规划

partSize 需满足供应商最小/最大 part 和总 part 数限制，同时考虑网络重试、浏览器内存和并发。客户端并行数有界，例如 4–8；每个 part 从固定 offset 读取，失败只重传该 part。

客户端记录 partNumber、字节范围、checksum、ETag 和完成时间。相同 partNumber 重传时通常覆盖先前 part，因此恢复前先向服务端或对象存储列出已上传 parts，以权威记录对账。不要只相信浏览器 localStorage。

## 完整性校验

[Amazon S3 Checking Object Integrity](https://docs.aws.amazon.com/AmazonS3/latest/userguide/checking-object-integrity-upload.html)描述了上传 checksum 与服务端验证能力。具体算法、full-object 与 composite checksum、ETag 是否代表 MD5 等行为随 API 和加密方式不同；不要把 ETag 一律当文件内容哈希。

客户端可计算每 part checksum，服务端记录对象存储返回的 ETag/checksum；Complete 时提交有序 part 清单。应用校验 part 数、顺序、总大小和完整对象 checksum。若产品需要内容寻址或强审计，使用明确 SHA-256，而不是推断供应商 ETag。

## 原子完成

Complete API 使用上传会话版本和幂等键。服务端先把状态从 uploading 条件更新为 processing，再向对象存储提交 Complete。网络 timeout 后可能不知道 Complete 是否成功，应查询 upload 状态或对象元数据对账，不能盲目再次创建新对象。

对象成功组合只是“字节完整”，还不是 READY。后续检查：

- 探测真实 MIME 和魔数，不只信 Content-Type 与扩展名；
- 解压、文档页数、图像尺寸和媒体时长有上限；
- 恶意软件和内容安全扫描；
- 租户、对象 key、加密、保留和访问策略；
- 业务级解析与 Schema 校验。

所有检查通过后原子写 READY 和发布对象版本；失败写 rejected 与稳定原因，并按策略隔离或删除。下游只读取 READY 记录，不能直接枚举 bucket 中刚上传的对象。

## Abort、过期与孤儿清理

Multipart 上传在 complete 或 abort 前会持续占用已上传 parts。[Multipart Upload Overview](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html)明确指出需要完成或停止上传，生命周期规则也可清理不完整 multipart。

应用定时扫描 expiresAt，条件更新为 expired，再 abort；对象存储配置更长的兜底生命周期，避免扫描器故障造成永久费用。清理延迟指标与存储账单对账。客户端主动取消走同一路径，操作幂等。

## 下载与访问控制

READY 文件的下载 URL 同样短时、按主体和用途签发。敏感文件不使用永久公开 URL；响应设置安全 Content-Type、Content-Disposition 和缓存策略。预览和转码产物使用独立 key 与来源版本，源文件删除时按保留规则处理派生物。

对象加密、密钥和地区由数据分类决定。日志记录 session、对象摘要和主体，不记录预签名 URL，因为 URL 本身是 bearer credential。

## 客户端恢复体验

客户端保存 uploadSessionId 与本地文件指纹，刷新后向服务端查询已完成 part，再只传缺失块。文件发生变化则创建新会话，不复用旧 parts。进度按已确认字节计算；上传 100% 后显示“正在验证”，直到 READY。

错误明确区分 URL 过期、配额、part checksum、会话过期、扫描拒绝和服务不可用。URL 过期只重新签发当前 part，不重新 initiate 整个上传。

## 安全与测试

测试覆盖越权 objectKey、超大文件、并发 part 覆盖、错误 checksum、重复 Complete、Complete timeout、取消竞争、会话过期、压缩炸弹、伪造 MIME、扫描服务故障和生命周期清理。断言客户端无法直接写 READY，非 READY 对象不能被业务读取。

指标包括创建/完成/放弃率、各 part 重试、上传与处理时长、checksum 失败、扫描拒绝、孤儿字节、清理延迟和每租户存储。Trace 从 session 创建关联到 Complete 与验证任务，但不传播预签名秘密。

## 小结

文件上传服务是一套状态协议：服务端创建受限会话，客户端直传有编号和校验的 parts，Complete 对账完整对象，再经过类型、安全和业务验证后发布 READY。Abort、恢复和生命周期清理同样是主流程，不能等账单异常时再补。

## 参考资料

- [Amazon S3：Uploading and copying objects using multipart upload](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html)
- [Amazon S3：Checking object integrity for data uploads](https://docs.aws.amazon.com/AmazonS3/latest/userguide/checking-object-integrity-upload.html)
