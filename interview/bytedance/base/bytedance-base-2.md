### 一面面经：

#### （1）说一下你理解的div

`div` 是 HTML 中最常用的**块级容器元素**，本身**无语义**，默认独占一行、宽度撑满父级，主要用于布局分块和样式承载。相比之下应优先用有语义的标签（`header`/`nav`/`section`/`article`）提升可读性和 SEO，`div` 用在纯布局场景。

#### （2）说一下flex

Flex 是 CSS3 的**弹性盒布局**，分**主轴**和**交叉轴**。容器设 `display: flex`：

+ **容器属性**：`flex-direction`（主轴方向）、`justify-content`（主轴对齐）、`align-items`（交叉轴对齐）、`flex-wrap`（换行）。
+ **项目属性**：`flex-grow`（放大比例）、`flex-shrink`（缩小比例）、`flex-basis`（基准大小），简写 `flex: 1` 等价 `flex: 1 1 0%`。

擅长一维布局与自适应对齐，比 float/inline-block 更简洁。

#### （3）说一下权重，看代码（父子和子的权重问题）

CSS 选择器权重按 **(内联, id, 类/属性/伪类, 标签)** 四元组比较，从高到低逐位比大小：

+ 内联样式 `1000` > id `100` > 类/属性/伪类 `10` > 标签/伪元素 `1`；`!important` 最高。
+ 权重相同时**后定义的覆盖先定义的**。
+ **注意**：直接命中子元素的选择器权重独立计算，与「父子层级」深浅无关。如 `.parent .child`（0,0,2,0）会被单独的 `#child`（0,1,0,0）覆盖，因为 id 权重更高，而非因为它更「具体地」指向子元素。

#### （4）说一下promise，手写并发控制

Promise 是异步的状态机（pending → fulfilled/rejected），状态不可逆，`.then` 链式解决回调地狱。

**并发控制答题思路**：维护一个「正在运行数 < 上限」的队列，每完成一个任务就从队列取下一个补位。

```javascript
function concurrentLimit(tasks, limit) {
  return new Promise((resolve) => {
    const results = []; let i = 0, done = 0;
    const run = () => {
      if (i >= tasks.length) return;
      const cur = i++;
      Promise.resolve(tasks[cur]()).then((res) => {
        results[cur] = res;
        if (++done === tasks.length) resolve(results);
        else run();
      });
    };
    for (let k = 0; k < Math.min(limit, tasks.length); k++) run();
  });
}
```

#### （5）怎么判断数组

+ **首选 `Array.isArray(arr)`**：最准确，能跨 iframe/realm。
+ `Object.prototype.toString.call(arr) === '[object Array]'`：通用类型判断。
+ `arr instanceof Array`：简单但跨 iframe 会失效。
+ `arr.constructor === Array`：可被改写，不可靠。

#### （6）typeof和instanceof的区别

+ **typeof**：返回类型字符串，适合判断**基本类型**（`number/string/boolean/undefined/symbol/bigint/function`）；缺陷是 `typeof null === 'object'`，且数组/对象都返回 `'object'`。
+ **instanceof**：沿**原型链**判断对象是否为某构造函数的实例，适合判断**引用类型**；对基本类型无效，且跨 iframe 会失效。

一句话：typeof 判基本类型，instanceof 判引用类型/继承关系。

#### （7）写代码，分割url

**答题思路**：解析 URL 的查询参数，推荐直接用 `URL` / `URLSearchParams`，手写则按 `?` 和 `&`、`=` 拆分。

```javascript
function parseQuery(url) {
  const query = {};
  const search = url.split('?')[1];
  if (!search) return query;
  search.split('#')[0].split('&').forEach((kv) => {
    const [k, v = ''] = kv.split('=');
    query[decodeURIComponent(k)] = decodeURIComponent(v);
  });
  return query;
}
// 原生：new URL(url).searchParams.get('key')
```

### 二面面经：

#### （1）场景题react

**答题思路**：React 场景题一般围绕**组件设计、状态管理、性能优化、通信**。答题时先复述需求、明确边界，再讲方案：状态放在哪一层（就近原则/提升到公共父级/全局 store）、如何避免不必要渲染（`memo`/`useMemo`/`useCallback`/合理拆分组件）、副作用如何管理（`useEffect` 依赖与清理）。结合具体题目落到可运行的实现。

#### （2）手写自定义hook，实现登陆拦截

**答题思路**：封装一个 `useAuth`，读取登录态（token），未登录时重定向到登录页，供路由/组件复用。

```javascript
function useAuthGuard() {
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/login', { replace: true });
  }, [navigate]);
}
// 组件中：function Protected(){ useAuthGuard(); return <Page/>; }
```

生产中通常再配合路由高阶组件/`<PrivateRoute>` 统一拦截，并校验 token 有效期。

#### （3）手写千分位格式化

```javascript
// 正则：从右往左每 3 位插入逗号（处理整数部分）
function thousands(num) {
  const [int, dec] = String(num).split('.');
  const formatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return dec ? `${formatted}.${dec}` : formatted;
}
thousands(1234567.89); // "1,234,567.89"
// 原生：num.toLocaleString('en-US')
```

### 三面面经：

#### （1）扫一扫登陆流程

**答题思路**：核心是「PC 端展示二维码 + 手机端已登录态授权 + 轮询/长连接同步状态」。

+ **（1）** PC 请求服务端生成唯一 `uuid` 并返回二维码（内含该 uuid），同时开始**轮询**或建立 WebSocket 监听扫码状态。
+ **（2）** 已登录的手机 App 扫码，携带 uuid 和用户凭证请求服务端，服务端标记为「已扫码待确认」。
+ **（3）** 手机确认授权后，服务端生成登录 token 与该 uuid 绑定。
+ **（4）** PC 端轮询到「已确认」，换取 token 完成登录。二维码有时效，防止被盗用。

#### （2）react通信，单项数据流

React 数据**自上而下单向流动**，父组件通过 `props` 传数据给子组件；子组件不能直接改 props，而是通过**父传下来的回调函数**通知父组件更新（状态提升）。跨层级通信用 **Context**，复杂全局状态用 Redux/Zustand。单向数据流让数据变化可预测、易调试。

#### （3）看代码，变量问题，promise问题

**答题思路**：这类输出题重点考三块：**（1）作用域与提升**——`var` 提升与函数级作用域、`let/const` 的块级作用域与 TDZ、闭包捕获的是变量引用（经典 `for` 循环 `var i` 打印问题）。**（2）事件循环**——同步 → 微任务（Promise.then）→ 宏任务（setTimeout），`await` 之后的代码等价于 `.then` 里的微任务。**（3）this 与执行时机**。按「同步先执行，再清空微任务队列，再取一个宏任务」的顺序逐行推演。

#### （4）写代码，数组里的0移到最后

**答题思路**：双指针原地交换，把非 0 元素依次前移，剩余补 0，时间 O(n)、空间 O(1)。

```javascript
function moveZeros(arr) {
  let j = 0; // 下一个非 0 应放的位置
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] !== 0) [arr[j++], arr[i]] = [arr[i], arr[j]];
  }
  return arr;
}
moveZeros([0, 1, 0, 3, 12]); // [1, 3, 12, 0, 0]
```
