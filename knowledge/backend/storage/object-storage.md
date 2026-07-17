对象存储不是“可以放文件的远程磁盘”。它以 bucket、object key 和版本为核心，通常通过 HTTP 访问，适合不可变或整体替换的大对象。设计时应同时处理对象身份、上传完整性、授权、版本、生命周期与元数据；只做一个上传接口，很快会遇到越权、覆盖、垃圾对象和费用失控。

![对象存储从受控签名、直传、校验到版本保留和生命周期清理的完整链路](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/object-storage-presigned-lifecycle-v1.webp)
*图：应用只签发受限能力，客户端直传后由服务端验证并登记；版本与生命周期共同决定恢复窗口和成本。*

## 对象身份与业务身份分离

object key 是存储定位符，不等于原始文件名，也不应直接作为授权判断。常用形式是 `tenant/{tenantId}/{randomId}` 或内容摘要，业务数据库另存 objectId、owner、MIME、size、hash、状态和当前 versionId。下载先检查业务权限，再生成短期访问能力。

用户文件名属于展示元数据，可能包含路径符号、控制字符或重名。服务端要规范化展示名，但存储 key 使用不可猜测 ID。不要允许客户端自由指定 bucket 或任意前缀，否则一张合法签名可能变成覆盖其他租户对象的入口。

## Presigned URL 是临时能力

[Amazon S3 预签名 URL 文档](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html)说明，签名允许持有者在有限时间内执行特定操作。它本质上是 bearer capability：谁拿到 URL，谁就能在权限和有效期内使用，所以不能写入公开日志、分析事件或可长期缓存的页面。

签名接口先认证用户并检查配额，再由服务端固定 method、bucket、key、过期时间和必要请求头。上传签名应约束 Content-Type、大小或校验和；使用 multipart upload 时，服务端创建 uploadId、签发各 part、完成后验证 part 清单，并定期清理未完成上传。

```text
客户端申请上传
  → 业务服务创建 pending object
  → 返回短期 PUT / multipart 签名
  → 客户端直传对象存储
  → 客户端提交完成通知
  → 服务端 HEAD 校验大小、类型、hash、version
  → 标记 ready，异步扫描与派生缩略图
```

“上传请求返回 200”不代表业务对象可用。服务端应验证对象确实位于预期 key、大小和摘要匹配，并在恶意文件扫描完成前隔离下载。完成回调可重复调用，状态转换必须幂等。

## 版本与覆盖恢复

[S3 Versioning](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Versioning.html)会为同一 key 保留多个版本。普通删除通常产生 delete marker，旧版本仍可恢复；但版本化也意味着覆盖和删除不再立即释放空间。数据库应记录使用中的 versionId，避免一次读取在覆盖并发下拿到不同内容。

版本不是备份的全部替代品：拥有删除版本权限的错误自动化仍可能清空历史，区域或账号级事故也需要独立保护。高价值数据可结合对象锁、跨账号复制和备份，但必须验证恢复流程与密钥可用性。

## 生命周期把成本变成策略

[对象生命周期文档](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html)支持把当前或非当前版本转入更低成本存储，或在条件满足后过期。规则应从业务保留期倒推：pending 上传保留多久、非当前版本恢复窗口多长、法律保留能否阻止删除、深度归档恢复要多久。

生命周期转换不是免费的“压缩”：低频层可能有最短存储期、取回费用和延迟。对经常读的小对象，转换成本可能高于节省；对需要分钟级 RTO 的数据，也不能只留在小时级取回层。将存储类型、版本数量、未完成 multipart 和跨区域流量纳入成本指标。

## 安全边界

bucket 默认私有，阻止公共访问；应用通过工作负载身份获得最小权限，管理面、上传、下载和删除使用不同角色。服务端加密同时定义密钥 owner、轮换、审计和跨区域恢复，不把“开启 SSE”当成完整密钥治理。

返回文件时设置安全的 `Content-Disposition`、准确 MIME 和必要的内容安全策略，避免用户上传 HTML/SVG 在主站域名执行。公开内容最好使用独立静态域名；敏感下载禁止共享 CDN 缓存，或将授权纳入缓存键。

## 验证清单

测试签名过期、篡改 method/key/header、跨租户 key、超限上传、摘要不符、完成通知重复、multipart 中断、版本覆盖与 delete marker 恢复。运维演练生命周期误配、密钥不可用和恢复旧版本。一个成熟方案能够回答：对象是谁的、当前引用哪个版本、谁能在多久内做什么、何时会被转储或删除，以及怎样证明它还能恢复。

## 参考资料

- [AWS：Using presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html)
- [AWS：Using versioning in S3 buckets](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Versioning.html)
- [AWS：Managing the lifecycle of objects](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html)
