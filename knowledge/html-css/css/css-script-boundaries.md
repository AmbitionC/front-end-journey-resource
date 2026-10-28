标准 CSS 用来描述页面怎样呈现，不能把任意 JavaScript 或后端脚本直接放进样式声明，期待浏览器把它当脚本执行。但这也不等于 CSS 只能写静态颜色：状态选择器、条件规则、动画、数值计算乃至自定义函数，都可以让样式随条件变化。回答“CSS 里面能写脚本吗”，关键是先说明语言、处理阶段和执行宿主。

## 先分清三个处理过程

浏览器将样式表解析为规则，根据文档、状态和环境计算样式，再参与布局与绘制。页面 JavaScript 则由脚本运行时执行，可以通过 DOM 和 CSSOM 改变元素或样式。常见的 Sass 工程还多一步：编译器先把 SCSS/Sass 转成 CSS，再交给浏览器。[WHATWG 的 style 元素处理规则](https://html.spec.whatwg.org/multipage/semantics.html#the-style-element)、[CSSOM 的脚本接口](https://www.w3.org/TR/cssom-1/#introduction)与 [Sass 编译说明](https://sass-lang.com/guide/#preprocessing)分别规定了这些职责。

![构建阶段将 SCSS 编译成 CSS；浏览器分别解释 CSS 样式规则和执行 JavaScript，后者通过 DOM 与 CSSOM 操作页面](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/css-script-boundaries-build-style-js-v1.png)
*图：三行比较不同的处理职责，不表示严格串行的渲染时间表。脚本改变 DOM 或 CSSOM 后可以触发样式重新计算；这不意味着 CSS 调用了 JavaScript 运行时。*

因此，“用 JavaScript 生成 CSS”“CSS 引用了绘制扩展”和“CSS 声明本身执行任意脚本”是不同说法。看到函数括号或源码里出现 script，也不足以判断谁在执行什么。

## 有条件、有动画，为什么仍是声明式样式

声明式规则描述“条件满足时采用什么表现”，浏览器负责匹配与更新。例如下面的教学片段不需要应用 JavaScript，就能改变悬停状态，并按用户的减少动态效果偏好关闭过渡：

```html
<style>
  .card { transition: transform 150ms; }
  .card:hover { transform: translateY(-2px); }
  @media (prefers-reduced-motion: reduce) {
    .card { transition: none; }
  }
</style>
<article class="card">课程资料</article>
```

这里没有一个由作者编写的 JavaScript 事件回调。浏览器根据状态和媒体条件应用样式；`@supports` 判断能力条件，`@keyframes` 描述属性随时间的变化，也有各自定义的语义。[CSS 条件规则](https://www.w3.org/TR/css-conditional-3/)与[动画规范](https://www.w3.org/TR/css-animations-1/)支持这类动态表现，不能据此推出 CSS 拥有任意 DOM 操作、业务请求或文件访问能力。

同理，`calc()`、`var()` 和样式中的条件表达式都有特定输入与结果含义，不能把函数形式等同于 JavaScript 的任意函数调用。CSS 规范仍在演进，判断某个新语法时应查对应模块和目标浏览器。

## 原生 CSS 自定义函数不等于嵌入 JavaScript

[CSS Functions and Mixins Module 的执行模型](https://www.w3.org/TR/css-mixins-1/#execution-model)明确把自定义函数放在声明式模型中：参数、局部值和结果按 CSS 规则解释，函数里的条件规则决定哪些声明参与计算。它不是把一段 JavaScript 函数体交给脚本引擎执行。

截至 2026-10-28，本页核对的该模块公开版本属于工作草案；语法演进、规范阶段和浏览器实现是不同维度。不要背“CSS 永远没有函数或条件”，也不要因看到 `@function` 就声称任何浏览器都支持，更不能套用 JavaScript 的逐句执行或提前 return 规则。

## 需要业务交互时，脚本在自己的宿主中执行

下面只是说明职责的独立教学片段。点击处理由 JavaScript 执行，CSS 根据元素最终拥有的类决定颜色：

```html
<style>
  .active { color: green; }
</style>
<button id="mark" type="button">切换标记</button>
<script>
  const mark = document.querySelector("#mark");
  mark.addEventListener("click", () => {
    mark.classList.toggle("active");
  });
</script>
```

JavaScript 通过 DOM 修改类，或通过 CSSOM 的 `style.setProperty()` 等接口改变声明；样式解析器没有因此成为脚本执行器。[CSSOM 的 CSSStyleDeclaration 接口](https://www.w3.org/TR/cssom-1/#the-cssstyledeclaration-interface)规定了这些样式访问方法。真实业务的鉴权与数据写入仍由相应服务执行，隐藏按钮或改类名不能替代服务端权限判断。

## 三类看似反例的情况

| 情况 | 实际执行位置与边界 |
| --- | --- |
| Sass/SCSS 中的变量、循环和函数 | 常见构建流程由 Sass 编译器处理，产物是 CSS。浏览器没有因为收到产物就获得 Sass 的编译期能力。 |
| CSS Houdini 的 `paint()` | 在支持的宿主中，页面脚本用 `CSS.paintWorklet.addModule()` 加载独立模块，模块注册绘制类，CSS 再按接口引用。JavaScript 运行在受限的 Worklet 环境，不是直接嵌入普通属性值。 |
| 服务器脚本生成样式表 | 服务器先执行自身代码，再返回 CSS；浏览器收到 CSS 不会自动运行服务器语言。 |

[CSS Painting API](https://www.w3.org/TR/css-paint-api-1/#paint-worklet)说明了 Paint Worklet、注册和引用关系。它是浏览器扩展接口，需要核对实际支持与环境限制；不能推成样式表可以直接执行任意脚本或读取宿主文件。

历史 IE 还存在过 DHTML expression 一类扩展；[微软归档文档](https://learn.microsoft.com/en-us/previous-versions/ff728875(v=vs.85))明确说明 IE8 模式不再支持表达式。讨论这类历史兼容时应明确浏览器与文档模式，不能拿旧扩展概括现代标准 CSS，也不应把它当作新页面的实现建议。

## 面试中怎样给出有边界的答案

可以这样回答：“如果指把任意 JavaScript 或后端脚本直接写进标准 CSS 声明执行，不可以。CSS 可以声明状态、条件、动画和样式计算；业务脚本由自己的运行时执行，再通过 DOM/CSSOM 影响样式。预处理器、CSS 自定义函数和 Houdini 要分别说明处理阶段与宿主，不能仅凭有函数或动态效果就把它们混成任意脚本。”

遇到具体片段，先问四件事：文件最终交给哪个解析器，语法属于哪份规范或工具，在哪个阶段处理，宿主授予了什么 API。对布局能力可继续阅读[现代 CSS 布局与响应式设计](responsive-layout.md)；对浏览器处理职责可阅读[导航到页面呈现](../../fe/browser/browser-navigation-rendering.md)。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [快手 Agent 岗一面：CSS 能力边界与插入幂等](../../../interview/kuaishou/ai/kuaishou-ai-10.md)
<!-- interview-source-history:end -->

## 参考资料

- [WHATWG HTML：The style element](https://html.spec.whatwg.org/multipage/semantics.html#the-style-element)
- [W3C：CSSOM](https://www.w3.org/TR/cssom-1/)
- [W3C：CSS Conditional Rules Module Level 3](https://www.w3.org/TR/css-conditional-3/)
- [W3C：CSS Animations Level 1](https://www.w3.org/TR/css-animations-1/)
- [W3C：CSS Functions and Mixins Module](https://www.w3.org/TR/css-mixins-1/)
- [W3C：CSS Painting API Level 1](https://www.w3.org/TR/css-paint-api-1/)
- [Sass：Preprocessing](https://sass-lang.com/guide/#preprocessing)
- [Microsoft Learn 归档：DHTML expressions 的文档模式说明](https://learn.microsoft.com/en-us/previous-versions/ff728875(v=vs.85))
