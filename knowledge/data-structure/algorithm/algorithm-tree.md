![同一图从节点 A 出发：左侧 BFS 用 queue 按层扩展 frontier，右侧 DFS 用 stack 深入回溯；visited set 阻止环重复，树结构作为无环特例](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/tree-graph-bfs-dfs-frontiers-v1.webp)
*图：沿图中的节点与箭头阅读，重点是区分 tree 与 general graph、DFS/BFS、visited、递归/显式栈和遍历复杂度，避免在有环图上无限访问。*

---

树是没有环且节点之间只有一条简单路径的特殊图。二叉树节点通常用 `left` / `right` 表示孩子；一般树则更适合用 `children` 数组。图中的 BFS/DFS 示意还画出了 `visited`：遍历一般图时必须记录已访问节点，避免在环上重复扩展；遍历严格的树时，可以用“父节点不回退”等结构约束省略它。（参见 [Boost Graph Library breadth-first search](https://www.boost.org/doc/libs/latest/libs/graph/doc/breadth_first_search.html) 与 [depth-first search](https://www.boost.org/doc/libs/latest/libs/graph/doc/depth_first_search.html)）

```javascript
function bfsGraph(start, neighbors) {
  const order = [];
  const queue = [start];
  const visited = new Set([start]);

  for (let head = 0; head < queue.length; head++) {
    const node = queue[head];
    order.push(node);
    for (const next of neighbors.get(node) ?? []) {
      if (visited.has(next)) continue;
      visited.add(next); // 入队时标记，防止被多个前驱重复加入
      queue.push(next);
    }
  }
  return order;
}
```

#### 1. 二叉树的最大深度
**问题**：给定一个二叉树，找出其最大深度。  
**解法**：递归遍历左右子树，取较大者深度加一。（参见 [Boost Graph Library depth-first search](https://www.boost.org/doc/libs/latest/libs/graph/doc/depth_first_search.html)）

```javascript
function maxDepth(root) {
  if (!root) return 0;
  return Math.max(maxDepth(root.left), maxDepth(root.right)) + 1;
}
```



#### 2. 二叉树的层序遍历
**问题**：给定一个二叉树，按层序遍历其节点值。  
**解法**：使用队列进行广度优先搜索（BFS）。（参见 [Boost Graph Library breadth-first search](https://www.boost.org/doc/libs/latest/libs/graph/doc/breadth_first_search.html)）

```javascript
function levelOrder(root) {
  const result = [];
  if (!root) return result;
  const queue = [root];
  let head = 0;
  while (head < queue.length) {
    const levelSize = queue.length - head;
    const currentLevel = [];
    for (let i = 0; i < levelSize; i++) {
      const node = queue[head++];
      currentLevel.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(currentLevel);
  }
  return result;
}
```



#### 3. 二叉搜索树（BST）的插入
**问题**：实现一个二叉搜索树的插入操作。  
**解法**：递归寻找插入位置。

```javascript
function insertIntoBST(root, val) {
  if (!root) return new TreeNode(val);
  if (val < root.val) root.left = insertIntoBST(root.left, val);
  else root.right = insertIntoBST(root.right, val);
  return root;
}
```



#### 4. 检查平衡二叉树
**问题**：检查一棵二叉树是否是平衡二叉树。  
**解法**：递归计算树的高度，并确保任意两个子树高度差不超过1。

```javascript
function isBalanced(root) {
  if (!root) return true;
  const leftHeight = height(root.left);
  const rightHeight = height(root.right);
  return Math.abs(leftHeight - rightHeight) <= 1 && isBalanced(root.left) && isBalanced(root.right);
}

function height(node) {
  if (!node) return 0;
  return 1 + Math.max(height(node.left), height(node.right));
}
```



#### 5. 二叉树的锯齿形层序遍历
**问题**：给定一个二叉树，返回其锯齿形层序遍历。  
**解法**：使用BFS，并通过一个标志位控制每层的顺序。

```javascript
function zigzagLevelOrder(root) {
  const result = [];
  if (!root) return result;
  let leftToRight = true;
  const queue = [root];
  let head = 0;
  while (head < queue.length) {
    const levelSize = queue.length - head;
    const currentLevel = [];
    for (let i = 0; i < levelSize; i++) {
      const node = queue[head++];
      currentLevel[(leftToRight ? i : levelSize - 1 - i)] = node.val;
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(currentLevel);
    leftToRight = !leftToRight;
  }
  return result;
}
```



#### 6. 树的高度
**问题**：给定一棵以 `children` 数组表示的一般树，返回其高度。
**解法**：叶子高度为 1；非叶节点递归计算所有孩子子树的高度，取最大值加一。

```javascript
function treeHeight(root) {
  if (!root) return 0;
  if (!root.children?.length) return 1;
  return 1 + Math.max(...root.children.map(treeHeight));
}
```



#### 7. 二叉树的镜像
**问题**：给定一棵二叉树，返回其镜像。  
**解法**：递归交换左右子节点。

```javascript
function mirrorTree(root) {
  if (!root) return null;
  [root.left, root.right] = [mirrorTree(root.right), mirrorTree(root.left)];
  return root;
}
```



#### 8. 树的直径
**问题**：给定一棵二叉树，返回其直径长度。  
**解法**：直径为任意两个节点间最长路径的长度。

```javascript
function diameterOfBinaryTree(root) {
  let diameter = 0;
  const depth = (node) => {
    if (!node) return 0;
    const left = depth(node.left);
    const right = depth(node.right);
    diameter = Math.max(diameter, left + right);
    return Math.max(left, right) + 1;
  };
  depth(root);
  return diameter;
}
```



#### 9. 二叉树的前序遍历
**问题**：给定一棵二叉树，实现前序遍历。  
**解法**：访问根节点，然后递归遍历左子树和右子树。

```javascript
function preorderTraversal(root) {
  const result = [];
  const traverse = (node) => {
    if (!node) return;
    result.push(node.val);
    traverse(node.left);
    traverse(node.right);
  };
  traverse(root);
  return result;
}
```



#### 10. 二叉树的后序遍历
**问题**：给定一棵二叉树，实现后序遍历。  
**解法**：递归遍历左子树和右子树，然后访问根节点。

```javascript
function postorderTraversal(root) {
  const result = [];
  const traverse = (node) => {
    if (!node) return;
    traverse(node.left);
    traverse(node.right);
    result.push(node.val);
  };
  traverse(root);
  return result;
}
```

## 二叉树子结构：候选根与局部匹配

子结构与整棵子树相等是两个条件。本文约定：B 的节点值和左右关系须出现在 A 的某个根下，但 A 可以有 B 未要求的额外节点；公开接口把空 B 判为不是子结构。若题目要求整棵子树相等，双空与单空的判定必须另写。

外层遍历 A 的每个候选起点，内层只检查 B 提出的要求。内层 B 已空表示该分支要求匹配完；B 未空而 A 已空、或值不同，则匹配失败。这个 base case 不能与外层空 B 的约定混为一谈。

```javascript
function isSubstructure(a, b) {
  if (!a || !b) return false;
  function matches(x, y) {
    if (!y) return true;
    if (!x || x.val !== y.val) return false;
    return matches(x.left, y.left) && matches(x.right, y.right);
  }
  return matches(a, b) || isSubstructure(a.left, b) || isSubstructure(a.right, b);
}
```

例如 A 的根值为 2、左孩子为 1，另有额外右孩子，B 只要求根 2 与左孩子 1，可以匹配；若 B 要求右孩子 3 而 A 没有，就失败。重复根值时，第一次局部失败不能提前否定所有后续候选。对节点数 n、m，朴素最坏时间 O(nm)，递归栈取决于树高，粗上界 O(hA+hB)。代码假设是真正无环的树；一般有环对象图需另处理重复访问。
## 最大宽度：数位置，而非节点数

[LeetCode 662 的规格](https://leetcode.com/problems/maximum-width-of-binary-tree/)把两端非空节点之间的空位也计入宽度。因此只数一层有几个节点会错。给根位置 0，左右孩子位置分别为 2i 与 2i+1，一层的宽度是末位置减首位置再加一。

每层减去该层首位置不改变相对距离，可以减少不必要的增长。下面的 JS 教学实现用 BigInt 保存位置，返回 BigInt；一般树的宽度可能超过 Number 安全整数。它假定输入无环，每个节点只访问一次，空间 O(w)，整数运算成本还受位置位数影响。

```javascript
function maximumWidth(root) {
  if (!root) return 0n;
  let queue = [[root, 0n]], best = 0n;
  while (queue.length) {
    const base = queue[0][1], next = [];
    const width = queue[queue.length - 1][1] - base + 1n;
    if (width > best) best = width;
    for (const [node, position] of queue) {
      const i = position - base;
      if (node.left) next.push([node.left, 2n * i]);
      if (node.right) next.push([node.right, 2n * i + 1n]);
    }
    queue = next;
  }
  return best;
}
```

测试空树、单边深链和同层两端稀疏节点，后者可以证明空位不能省略。位置编号是教学算法的辅助数据，不需要真的创建全部空节点。

## 无权树最大独立集：后序保存选与不选

独立集要求任意两个选中顶点都没有边相连。原帖只给题名，下面自选教学合同为：`n` 个编号 `0..n-1` 的顶点、无向无权边列表，返回最大独立集的**数量**；空输入 `n=0, edges=[]` 返回 0，非空输入必须是连通无环树。重复边、自环、越界编号与不连通图拒绝，不推断现场是否带权、是否需要返回集合或使用哪种语言。

[CMU 树动态规划讲义第 3 节](https://www.cs.cmu.edu/~15451-f24/lectures/lecture09-dp.pdf)从选根或不选根推导最优子结构。这里将所有顶点权重设为 1，并保存两个显式状态：`take[v]` 为必须选 v 的最优数量，`skip[v]` 为必须不选 v 的最优数量。

~~~text
take[v] = 1 + sum(skip[c])
skip[v] = sum(max(take[c], skip[c]))
~~~

选 v 就不能选孩子；不选 v 时，每个孩子可以独立选更优状态。树的孩子子树互不相交且没有跨子树边，因此这些最优解可以相加。叶子为 1/0，答案取根两状态最大值。这是对讲义最优子结构的两状态展开，不是原作者的代码。三节点路径以中点为根：选中点得 1，不选则可取两端得 2；局部度数或“一直选根”不能代替状态比较。

下面先验证边和连通性，建立父数组与父先于子的遍历序，再逆序累计子状态。它使用显式数组，避免深链触发 JavaScript 递归栈限制；只跳过父节点而不检查已访问节点，不能把一般图当成树。


```javascript
function maximumIndependentSetSize(n, edges) {
  if (!Number.isSafeInteger(n) || n < 0 || !Array.isArray(edges)) {
    throw new TypeError('Expected a nonnegative safe integer and edge array');
  }
  if (edges.length !== Math.max(0, n - 1)) {
    throw new RangeError('A nonempty tree needs n-1 edges');
  }
  const adjacent = Array.from({length: n}, () => []);
  for (const edge of edges) {
    if (!Array.isArray(edge) || edge.length !== 2) throw new TypeError('Expected endpoint pair');
    const [u, v] = edge;
    if (!Number.isInteger(u) || !Number.isInteger(v) || u < 0 || v < 0 || u >= n || v >= n || u === v) {
      throw new RangeError('Invalid endpoint or self loop');
    }
    adjacent[u].push(v);
    adjacent[v].push(u);
  }
  if (n === 0) return 0;
  const parent = Array(n).fill(-2), order = [0];
  parent[0] = -1;
  for (let i = 0; i < order.length; i++) {
    const v = order[i];
    for (const u of adjacent[v]) {
      if (u === parent[v]) continue;
      if (parent[u] !== -2) throw new RangeError('Cycle or duplicate edge');
      parent[u] = v;
      order.push(u);
    }
  }
  if (order.length !== n) throw new RangeError('Tree must be connected');
  const take = Array(n).fill(1), skip = Array(n).fill(0);
  for (let i = order.length - 1; i > 0; i--) {
    const v = order[i], p = parent[v];
    take[p] += skip[v];
    skip[p] += Math.max(take[v], skip[v]);
  }
  return Math.max(take[0], skip[0]);
}
```

每条边仅做常数次处理，时间 O(n)，邻接、父数组、顺序与 DP 状态共 O(n) 空间。代码不修改输入边列表，只返回数量；带权、森林或返回实际节点集合需要另定合同。

该教学实现已与独立枚举所有顶点子集的 oracle 对照，覆盖 1 至 7 顶点的 18249 棵标号树，并检查空树、非法图、边界与 100001 节点深链。测试支持这些实现行为，递推正确性仍依赖上面的最优子结构论证；没有把这些测试称作原作者现场验证。

口述时可说：“独立集不能包含相邻点。树上选父则跳过孩子，不选父时各孩子可独立取更优状态，后序累加两个状态，最后取根的最大值；成立前提是明确的树输入合同。”

以下是教学模拟追问：

- **若每个节点有权重，还能直接用当前函数吗？** 不能；需另定义权重与空集合同，再把选中状态的 1 改为该节点权重并验证数值边界。
- **把三角形图也只跳过父边，会发生什么？** 子树不再独立，遍历还可能重复；当前实现拒绝这种图，树递推不能直接用于一般图。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [字节 Agent 一面：会话记忆、并发更新与算法](../../../interview/bytedance/base/bytedance-base-29.md)
- [字节 Agent 实习：异步消息、上下文与容器隔离](../../../interview/bytedance/base/bytedance-base-41.md)
- [百度大模型研发一面：Context、Harness 与 RAG（2026 年 8 月）](../../../interview/baidu/ai/baidu-ai-1.md)
- [字节生活服务 AI 全栈二面：AI 作业、接口幂等与树题](../../../interview/bytedance/base/bytedance-base-64.md)
<!-- interview-source-history:end -->

## 参考资料

- [Boost Graph Library breadth-first search](https://www.boost.org/doc/libs/latest/libs/graph/doc/breadth_first_search.html)
- [Boost Graph Library depth-first search](https://www.boost.org/doc/libs/latest/libs/graph/doc/depth_first_search.html)
- [CMU 15-451 Fall 2024：Dynamic Programming，第 3 节树独立集](https://www.cs.cmu.edu/~15451-f24/lectures/lecture09-dp.pdf)（稳定算法讲义；2026-10-20 北京时间核验）
