### 面试中的问题：

#### （1）网络协议的基础知识

+ **TCP vs UDP**：TCP 面向连接、可靠有序（三次握手、确认重传、流量与拥塞控制），开销大；UDP 无连接、不保证可靠但延迟低、开销小，适合音视频、直播、DNS 等。
+ **TCP 长连接与 keep-alive**：TCP 层的 `SO_KEEPALIVE` 是**保活探测**——空闲一段时间后发探测包，检测对端是否存活并回收死连接；它与 HTTP 层的 `Connection: keep-alive`（复用同一 TCP 连接发多个请求）是**两个不同层面**的概念，注意区分。

#### （2）内存管理和设计模式

+ **C++ 内存管理**：手动 `new`/`delete` 易漏释放或重复释放，用 **RAII** 把资源生命周期绑定到对象。
+ **智能指针**：`unique_ptr`（独占所有权）、`shared_ptr`（引用计数共享）、`weak_ptr`（打破 `shared_ptr` 循环引用）。
+ **常见设计模式**：单例、工厂、观察者、策略等，考察时结合场景说明用它解决了什么问题（解耦、扩展、复用）。

#### （3）Objective-C中的设计模式

iOS/OC 中常见模式：

+ **单例（Singleton）**：如 `[NSUserDefaults standardUserDefaults]`，用 `dispatch_once` 保证线程安全。
+ **委托（Delegate）**：一对一回调，如 `UITableViewDelegate`。
+ **观察者（Observer）**：KVO 与 `NSNotificationCenter`，一对多通知。
+ **MVC**：Cocoa 的基础架构模式；工厂、装饰（Category）等也常见。

#### （4）委托和Block的内存管理

核心是**避免循环引用（retain cycle）导致内存泄漏**：

+ **Delegate**：委托属性应声明为 **`weak`**，防止 A 持有 B、B 又强持有 A。
+ **Block**：Block 会**强引用**其捕获的对象；若对象又持有该 Block（如作为属性）就形成环。解决办法：`__weak typeof(self) weakSelf = self;` 在 Block 内使用 weakSelf，必要时再 `__strong` 强引用防止执行期间被释放。

#### （5）Git命令的应用

常用命令：`git clone/pull/push`、`git add/commit`、`git branch/checkout`（或 `switch`）切换分支、`git merge`/`git rebase` 合并、`git stash` 暂存、`git reset`/`git revert` 回退、`git log`/`git diff` 查看历史与差异。协作中重点是**分支管理规范**（feature 分支开发、PR/MR Code Review、解决冲突）。

#### （6）编程题目的解答

**答题思路**：「最长不重复子串」用**滑动窗口 + 哈希表**——右指针扩展窗口，用哈希记录字符最近出现位置；遇到重复字符时把左指针跳到重复位置的下一位，全程维护最大窗口长度。时间复杂度 O(n)。

```javascript
function lengthOfLongestSubstring(s) {
  const map = new Map();
  let left = 0, max = 0;
  for (let right = 0; right < s.length; right++) {
    if (map.has(s[right]) && map.get(s[right]) >= left) {
      left = map.get(s[right]) + 1;
    }
    map.set(s[right], right);
    max = Math.max(max, right - left + 1);
  }
  return max;
}
```

#### （7）工作经历、项目经验

**答题思路**：用 STAR 结构讲项目，重点是**你如何用设计模式/技术方案解决实际难点**，并沉淀出**可复用的解决方案**（组件、工具、规范）。突出你的独立贡献和量化结果，准备好被追问技术细节。
