DNS 把域名映射为资源记录，是带委派和缓存的分布式数据库，不是一次“问某台服务器要 IP”的调用。排障要沿 stub resolver、recursive resolver、root、TLD 和 authoritative server 追踪，并同时考虑 TTL、负缓存、多个记录、DNSSEC、传输与应用连接复用。

![DNS 从 Stub、递归解析器、Root、TLD 到权威服务器的解析、缓存、负缓存与故障切换](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/dns-analysis-resolution-cache-failover-v1.webp)
*图：递归 resolver 缓存委派和答案；NXDOMAIN 也会负缓存；权威或递归节点故障的用户时延受重试与缓存影响。*

## 角色与递归过程

应用通常调用操作系统 stub resolver，把递归查询交给本地/企业/ISP/公共 recursive resolver。缓存未命中时，递归器从 root 得到 TLD 委派，再向 TLD 得到域的 authoritative nameserver，最后取得 A/AAAA 等答案。

[RFC 1034](https://www.rfc-editor.org/rfc/rfc1034.html)与 [RFC 1035](https://www.rfc-editor.org/rfc/rfc1035.html)定义 DNS 概念、数据和协议。Root/TLD 返回 delegation（NS 与必要 glue），不是替所有域保存最终 IP。权威服务器对 zone 数据负责，递归器负责替客户端追问和缓存。

## Resource Records

A/AAAA 映射 IPv4/IPv6，CNAME 表示别名，NS 声明权威，MX 邮件路由，TXT 承载文本策略，SRV 描述服务/端口，SOA 包含 zone 管理与序列等。每条 RR 有 owner name、type、class、TTL 和 data。

CNAME 链增加查询和失败点，且 apex 使用受 DNS 规则限制；云厂商 ALIAS/ANAME 是提供商扩展。客户端最终可能得到多个 A/AAAA，选择和连接竞速由应用/系统实现，不保证按响应顺序轮询。

## TTL 与多层缓存

TTL 是缓存记录可复用的时间上限，不是“全球必定在该秒更新”。权威修改后，已有递归缓存会保留旧值至 TTL；操作系统、浏览器、JVM、代理和连接池还可能有自己的缓存/复用。

变更前提前至少一个旧 TTL 降低 TTL，等待旧缓存过期，再切记录；稳定后恢复合理 TTL。低 TTL 增加权威查询、成本和对故障敏感度，也不保证零停机。蓝绿切换应让新旧地址在传播窗口都可服务。

## Negative Caching

[RFC 2308](https://www.rfc-editor.org/rfc/rfc2308.html)定义 NXDOMAIN/NODATA 等负缓存，避免不存在名称被反复查询。误删记录后，即使立即恢复，递归器仍可能按负 TTL 返回不存在。SOA 中相关值影响缓存时间。

[RFC 9520](https://www.rfc-editor.org/rfc/rfc9520.html)进一步讨论 DNS resolution failure caching。要区分 authoritative NXDOMAIN、NOERROR/NODATA、SERVFAIL、timeout 和 REFUSED：它们的含义、缓存与重试不同。应用把所有错误显示成“域名不存在”会误导。

## 委派与 Glue

父 zone 通过 NS 委派子 zone。若 nameserver 名位于被委派 zone 内，解析其地址可能循环，父区提供 glue A/AAAA 帮助到达。Glue 是引导信息，权威数据仍在子 zone。

常见故障包括 parent NS 与 zone apex NS 不一致、glue 过期、只在某权威节点更新、serial 未推进和 DNS provider 网络不可达。用 `dig +trace` 查看委派链，用 `dig @server name type` 分别询问每个权威。

## 传输、大小与 DNSSEC

DNS 传统使用 UDP 53，响应截断可转 TCP；EDNS 增大 UDP payload，但路径 MTU/防火墙可能丢大包。现代环境也有 DoT/DoH，它们改变 stub 到 resolver 的传输，不改变权威委派模型。

DNSSEC 用签名与信任链验证数据来源/完整性。验证失败通常返回 SERVFAIL，而不是退回未验证答案。过期签名、错误 DS/DNSKEY 或时钟问题都可能导致“权威看似有记录，验证 resolver 不返回”。排障比较验证与非验证查询，但不能在生产简单关闭验证当修复。

## 高可用与 Failover

域至少配置多个权威服务器，并放在独立故障域/网络；parent 委派和每台 zone 数据一致。多个 NS 不意味着客户端立即无感切换：recursive resolver 会按自己的超时与重试尝试，某个黑洞权威会增加尾延迟。

DNS failover 通过健康检查改变答案，但缓存中的旧地址在 TTL 内仍被使用，现有 TCP 连接可能更久。旧端点应在 drain 窗口继续服务或明确拒绝。DNS 不能替代应用级 retry、负载均衡和数据层灾备。

## 递归解析器高可用

客户端配置多个 recursive resolver，但操作系统可能按顺序、并行或超时后切换，行为不统一。企业网络应提供 anycast/本地冗余并监控外部域与内部 split-horizon。VPN、search domain 和 `/etc/hosts` 可让同一名称在不同客户端结果不同。

不要把 8.8.8.8 当万能测试：公共 resolver 可能无法访问内部 zone，其缓存也与企业 resolver 不同。始终记录测试使用的 resolver、query type、flags 和时间。

## 系统化排障

先 `dig name A/AAAA` 看 status、answer、TTL 与 SERVER；再直接问权威；检查 `+trace` 委派；比较多递归器；查看 DNSSEC；最后检查应用缓存和连接池。区分“解析正确但连不上”与“根本没答案”。

记录完整时间线：变更前 TTL、变更时刻、各 cache 剩余 TTL、权威一致性和应用连接年龄。不要只截图当前 dig，因为缓存问题是时间问题。

## 验证与演练

持续从不同区域监测 A/AAAA、权威可达、SOA serial、DNSSEC 到期和解析延迟。演练单权威故障、错误 NXDOMAIN、DS 配置错误、主 IP 下线与回滚。变更 runbook 包含降 TTL、等待、切换、验证和恢复 TTL。

DNS 的可靠性来自委派正确、缓存可预测、多个权威真实独立，以及应用理解旧答案会继续存在。把它当“改一条记录马上生效”，就会在故障切换时低估最关键的时间边界。

## 参考资料

- [RFC 1034：Domain Names—Concepts and Facilities](https://www.rfc-editor.org/rfc/rfc1034.html)
- [RFC 1035：Domain Names—Implementation and Specification](https://www.rfc-editor.org/rfc/rfc1035.html)
- [RFC 2308：Negative Caching of DNS Queries](https://www.rfc-editor.org/rfc/rfc2308.html)
- [RFC 9520：Negative Caching of DNS Resolution Failures](https://www.rfc-editor.org/rfc/rfc9520.html)
