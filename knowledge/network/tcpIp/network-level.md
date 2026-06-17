| 层级 | 功能 | 示例协议 |
| :---: | --- | --- |
| 应用层 | 提供用户接口和服务，与用户直接交互 | HTTP、FTP、SMTP、DNS等 |
| 传输层 | 提供端到端的数据传输服务，确保可靠性和顺序性 | TCP、UDP |
| 网络层 | 负责数据在网络中的传输和路由 | IP、ICMP、ARP等 |
| 数据链路层 | 将数据包封装成帧，在相邻节点之间传输 | Ethernet、PPP、ATM等 |
| 物理层 | 确定传输介质上的数据的电气特性 | RJ45、光纤等 |




常见的网络服务分层主要指的是TCP/IP协议族中的分层结构，也就是TCP/IP五层模型或OSI七层模型。TCP/IP协议族采用了四层抽象模型，而OSI模型则包含了七层。这里主要阐述的是TCP/IP四层模型，它包括：

#### 应用层(Application Layer): 
    - 提供应用程序接口，处理高层协议数据，实现应用程序间通信。
    - 常见协议：HTTP、HTTPS、FTP、SMTP、POP3、IMAP、DNS、Telnet、SSH、RTSP等。



#### 传输层(Transport Layer): 
    - 负责提供端到端的数据传输服务，确保数据的可靠传输或不可靠传输。
    - 常见协议：TCP（传输控制协议）提供可靠的数据传输服务，UDP（用户数据报协议）提供不可靠的数据传输服务。



#### 网络层(Network Layer): 
    - 负责将数据包从源主机路由到目的主机，主要通过IP地址寻址。
    - 常见协议：IP（Internet Protocol v4/v6）、ICMP（Internet Control Message Protocol）、IGMP（Internet Group Management Protocol）等。



#### 数据链路层(Link Layer)/网络接口层(Network Interface Layer): 
    - 实现网络中相邻节点之间的通信，负责封装数据帧并在物理链路上进行传输。
    - 常见协议：以太网(Ethernet)、Wi-Fi（IEEE 802.11系列标准）、PPP（Point-to-Point Protocol）等。

