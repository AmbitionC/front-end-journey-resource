阿里云技术线SRE技术部运维开发一面；面试月日未披露。以下选择部署、网络与排序三组问题。

经历和岗位来自候选人自述，未独立认证；以下短答、详解与例子为编辑补充，不是候选人的现场答案或企业标准答案。未披露条件先澄清，教学假设会单独说明。

<details data-knowledge-key="agent-project-deployment">
<summary>（1）介绍项目部署时，怎样交代环境、依赖与运行验证？</summary>
</details>

短答：说明操作系统和运行时版本、资源限制、外部依赖、配置来源、构建产物与启动方式，再给健康检查、日志、回滚和恢复证据。没有真实环境时只讲方法。

详解：进程存在、端口监听、依赖就绪与一次业务请求成功是不同层次。部署包还应固定代码、模型、工具与知识版本，回滚时考虑状态兼容。原文没给Docker/K8s、Linux命令或部署日志，本文不替作者补造；Linux基础深入题保持待补范围，不额外绑定知识热度。

知识导航：[将 Demo 做成可运行的线上项目](../../../knowledge/career/agent-project-deployment.md)。

<details data-knowledge-key="tcp-handshake">
<summary>（2）怎样区分 TCP 建连和关闭，以及 HTTPS 中 TLS 握手各自解决的问题？</summary>
</details>

短答：TCP同步连接状态与序列号，FIN分别关闭两个方向；TLS握手协商安全参数、认证并建立密钥。HTTPS不能被统一背成某一种固定次数的握手或挥手。

详解：限定使用TCP时，可分别解释SYN/SYN-ACK/ACK及双向FIN确认；FIN与ACK可能合并。TLS1.2、1.3和恢复方式会改变消息与往返，HTTP/3使用QUIC。应先问协议版本和具体问题，网络报文、逻辑握手消息与RTT也不能混为一谈。

知识导航：[TCP 建连、断开与连接状态](../../../knowledge/network/tcpIp/tcp-handshake.md)。

<details data-knowledge-key="algorithm-sorting">
<summary>（3）数组元素可以任意重排拼接，怎样得到尽可能大的数字？</summary>
</details>

短答：先确认输入是否为非负整数等条件。若按文中非空、无前导零十进制字符串合同，比较a+b与b+a，较大拼接排前，最后连接并把全零规范为0。

详解：按原整数大小或原字符串字典序排都会失效，例如3与30应比较330和303。相邻交换论证说明比较器的作用；不把拼接转成Number，避免大数精度丢失。文中纯函数实际用Node22核对9330个小数组及非法输入；这只验证所声明教学合同，不复原原题缺失条件或作者代码。

知识导航：[排序算法、稳定性与外部排序](../../../knowledge/cs/algorithm/algorithm-sorting.md)。

## 参考资料

- [Google SRE：生产就绪检查](https://sre.google/sre-book/evolving-sre-engagement-model/)
- [RFC9293：TCP](https://www.rfc-editor.org/rfc/rfc9293.html)
- [RFC8446：TLS1.3](https://www.rfc-editor.org/rfc/rfc8446.html)
- [MDN：比较器合同](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)
