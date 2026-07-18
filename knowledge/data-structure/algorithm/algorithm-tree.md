![同一图从节点 A 出发：左侧 BFS 用 queue 按层扩展 frontier，右侧 DFS 用 stack 深入回溯；visited set 阻止环重复，树结构作为无环特例](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/tree-graph-bfs-dfs-frontiers-v1.webp)
*图：沿图中的节点与箭头阅读，重点是区分 tree 与 general graph、DFS/BFS、visited、递归/显式栈和遍历复杂度，避免在有环图上无限访问。*

---

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
  while (queue.length) {
    const levelSize = queue.length;
    const currentLevel = [];
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
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
  while (queue.length) {
    const levelSize = queue.length;
    const currentLevel = [];
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
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
**问题**：给定一个任意树，返回其高度。  
**解法**：递归计算左子树和右子树的高度，取较大者加一。

```javascript
function treeHeight(root) {
  if (!root) return 0;
  return 1 + Math.max(treeHeight(root.left), treeHeight(root.right));
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

## 参考资料

- [Boost Graph Library breadth-first search](https://www.boost.org/doc/libs/latest/libs/graph/doc/breadth_first_search.html)
- [Boost Graph Library depth-first search](https://www.boost.org/doc/libs/latest/libs/graph/doc/depth_first_search.html)
