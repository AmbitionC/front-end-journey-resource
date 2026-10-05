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

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [百度大模型研发一面：Context、Harness 与 RAG（2026 年 8 月）](../../../interview/baidu/ai/baidu-ai-1.md)
- [字节 Agent 一面：会话记忆、并发更新与算法](../../../interview/bytedance/base/bytedance-base-29.md)
- [字节 Agent 实习：异步消息、上下文与容器隔离](../../../interview/bytedance/base/bytedance-base-41.md)
<!-- interview-source-history:end -->

## 参考资料

- [Boost Graph Library breadth-first search](https://www.boost.org/doc/libs/latest/libs/graph/doc/breadth_first_search.html)
- [Boost Graph Library depth-first search](https://www.boost.org/doc/libs/latest/libs/graph/doc/depth_first_search.html)
