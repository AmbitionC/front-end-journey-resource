![一个有序数组上 left/right 双指针向中间移动，每步展示不变量“已排除区间不可能含答案”；下方滑动窗口用 expand/shrink 保持约束，并区分 mutable array 与 immutable string](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/array-string-two-pointer-invariants-v1.webp)
*图：沿图中的节点与箭头阅读，重点是从连续序列、索引、原地更新、字符串不可变性和双指针不变量渐进展开。*

---

#### 1. 查找数组中的最大值

[ECMAScript Array Objects](https://tc39.es/ecma262/multipage/indexed-collections.html#sec-array-objects) 定义数组索引属性、`length` 与数组方法的标准语义；算法复杂度仍取决于具体操作和输入规模。

**问题**：找出数组中的最大元素。  
**解法**：使用`Math.max`和扩展运算符。

```javascript
const arr = [1, 3, 2, 8, 7];
const maxVal = Math.max(...arr);
console.log(maxVal); // 8
```



#### 2. 数组去重
**问题**：移除数组中的重复元素。  
**解法**：使用`Set`。

```javascript
const arr = [1, 2, 2, 3, 4, 4];
const uniqueArr = [...new Set(arr)];
console.log(uniqueArr); // [1, 2, 3, 4]
```



#### 3. 两个升序数组归并成降序数组

两个输入数组各自升序，尾部就是当前未处理部分的最大值。每次取两个尾部的较大者追加到输出，并仅移动它的指针；不变量是“输出已经降序，且已输出值不小于所有未处理值”。一个数组耗尽后，另一个也要从尾部逐个追加，不能把其升序余段直接拼接。[Princeton：归并使用有序子序列](https://algs4.cs.princeton.edu/22mergesort/)。

```javascript
function mergeDescending(arr1, arr2) {
  const result = [];
  let i = arr1.length - 1;
  let j = arr2.length - 1;
  while (i >= 0 && j >= 0) {
    if (arr1[i] > arr2[j]) result.push(arr1[i--]);
    else result.push(arr2[j--]);
  }
  while (i >= 0) result.push(arr1[i--]);
  while (j >= 0) result.push(arr2[j--]);
  return result;
}

console.log(mergeDescending([1, 3, 5], [6])); // [6, 5, 3, 1]
console.log(mergeDescending([1, 3], [2, 3])); // [3, 3, 2, 1]
```

重复元素按原输入保留；不修改输入。每步消耗一个元素，时间 O(n+m)，输出空间 O(n+m)。若题目要求升序输出，改为从两头部选较小者；若要求在预留容量的输入数组原地合并，则使用第 10 节从尾部填入较大值的写法，不能混用追加方向。

#### 3.1 两个升序序列的交集

两个指针从头开始。值不相等时移动较小者：它不可能与另一侧当前或更大的未处理值相等；相等时输出并同时移动。每个位置最多访问一次，时间 O(n+m)，除输出外空间 O(1)。这依赖两个输入都有序，不能直接套到无序流。

```javascript
function intersectSorted(a, b) {
  const result = [];
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] < b[j]) i += 1;
    else if (a[i] > b[j]) j += 1;
    else { result.push(a[i]); i += 1; j += 1; }
  }
  return result;
}
```

这段实现是多重集合交集：`[1,1,2]` 与 `[1,2,2]` 得 `[1,2]`，重复次数取两侧最小值。若要求唯一集合，应在命中后跳过双方相同值；不要在未确认题目契约时悄悄去重。
#### 4. 找出数组中第K大的元素
**问题**：找出数组中第K大的元素。  
**解法**：使用快速选择算法（类似于快速排序）。`k` 必须是 `1..arr.length` 内的整数；重复元素分别占一个名次。这段实现会原地调整数组，若需保留原数组，应传入副本。

```javascript
const partition = (arr, low, high) => {
  const pivot = arr[high];
  let i = low - 1;
  for (let j = low; j < high; j++) {
    if (arr[j] >= pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  return i + 1;
};

const quickSelect = (arr, k) => {
  if (!Number.isInteger(k) || k < 1 || k > arr.length) {
    throw new RangeError('k must be an integer between 1 and arr.length');
  }
  let low = 0;
  let high = arr.length - 1;
  while (true) {
    const pivotIndex = partition(arr, low, high);
    if (pivotIndex === k - 1) {
      return arr[pivotIndex];
    } else if (pivotIndex > k - 1) {
      high = pivotIndex - 1;
    } else {
      low = pivotIndex + 1;
    }
  }
};

const arr = [3, 2, 1, 5, 6, 4];
const k = 2;
console.log(quickSelect(arr, k)); // 5
```



#### 5. 判断数组是否为子数组
**问题**：判断一个数组是否为另一个数组的子数组。  
**解法**：使用双指针。

```javascript
const isSubArray = (mainArr, subArr) => {
  const n = mainArr.length;
  const m = subArr.length;
  if (m > n) return false;

  for (let i = 0; i < n - m + 1; i++) {
    if (mainArr.slice(i, i + m).every((val, index) => val === subArr[index])) {
      return true;
    }
  }
  return false;
};

const arr1 = [1, 2, 3, 4];
const arr2 = [2, 3];
console.log(isSubArray(arr1, arr2)); // true
```



#### 6. 旋转数组
**问题**：将数组向右旋转k步。  
**解法**：翻转整个数组，再翻转前k个元素，最后翻转剩余元素。

```javascript
const rotate = (nums, k) => {
  k = k % nums.length;
  const reverse = (start, end) => {
    while (start < end) {
      [nums[start], nums[end]] = [nums[end], nums[start]];
      start++;
      end--;
    }
  };

  reverse(0, nums.length - 1);
  reverse(0, k - 1);
  reverse(k, nums.length - 1);
};

const nums = [1, 2, 3, 4, 5, 6, 7];
rotate(nums, 3);
console.log(nums); // [5, 6, 7, 1, 2, 3, 4]
```



#### 7. 两数之和
**问题**：给定一个数组和一个目标值，找出数组中和为目标值的两个数。  
**解法**：使用哈希表。

```javascript
const twoSum = (nums, target) => {
  const map = {};
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map[complement] !== undefined) {
      return [map[complement], i];
    }
    map[nums[i]] = i;
  }
  return [];
};

const nums = [2, 7, 11, 15];
const target = 9;
console.log(twoSum(nums, target)); // [0, 1]
```



#### 8. 移动元素到数组末尾
**问题**：给定一个数组，将所有的零移动到数组的末尾，同时保持非零元素的顺序。  
**解法**：双指针。

```javascript
const moveZeroes = (nums) => {
  let j = 0; // 非零元素的索引
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] !== 0) {
      nums[j++] = nums[i];
    }
  }
  while (j < nums.length) {
    nums[j++] = 0;
  }
  return nums;
};

const nums = [0, 1, 0, 3, 12];
moveZeroes(nums);
console.log(nums); // [1, 3, 12, 0, 0]
```



#### 9. 验证回文字符串
**问题**：判断一个字符串是否是回文结构。  
**解法**：使用双指针。

```javascript
const isPalindrome = (s) => {
  const cleanStr = s.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  let left = 0;
  let right = cleanStr.length - 1;

  while (left < right) {
    if (cleanStr[left] !== cleanStr[right]) {
      return false;
    }
    left++;
    right--;
  }
  return true;
};

const str = "A man, a plan, a canal: Panama";
console.log(isPalindrome(str)); // true
```



#### 10. 合并两个有序数组

[Princeton COS 226 双指针材料](https://www.cs.princeton.edu/courses/archive/spring26/cos226/precepts/advanced-precept5.pdf) 展示了利用有序性单调排除候选区间的线性扫描；“两个指针”本身不是正确性的证明，不变量才是。

**问题**：给定两个有序整数数组，在原地合并它们，使它们成为一个有序数组。  
**解法**：从后向前填充较大的元素。

```javascript
const merge = (nums1, m, nums2, n) => {
  let i = m - 1;
  let j = n - 1;
  let k = nums1.length - 1;

  while (i >= 0 && j >= 0) {
    if (nums1[i] > nums2[j]) {
      nums1[k--] = nums1[i--];
    } else {
      nums1[k--] = nums2[j--];
    }
  }

  // 如果nums2中还有剩余，直接复制到nums1前面
  while (j >= 0) {
    nums1[k--] = nums2[j--];
  }
};

const nums1 = [1, 2, 3, 0, 0, 0];
const nums2 = [2, 5, 6];
merge(nums1, 3, nums2, 3);
console.log(nums1); // [1, 2, 2, 3, 5, 6]
```

#### 11. 三数之和

**问题**：返回数组中所有和为目标值的、不重复的三元组。

先排序，枚举第一个位置，再用左右指针在剩余区间寻找另外两个数。固定值与命中后的左右值都要跳过重复元素；当前最小可能和已经大于目标时可提前结束，最大可能和小于目标时可跳过当前固定值。

```javascript
function threeSum(nums, target = 0) {
  nums.sort((a, b) => a - b);
  const result = [];

  for (let i = 0; i < nums.length - 2; i += 1) {
    if (i > 0 && nums[i] === nums[i - 1]) continue;

    let left = i + 1;
    let right = nums.length - 1;
    while (left < right) {
      const sum = nums[i] + nums[left] + nums[right];
      if (sum < target) {
        left += 1;
      } else if (sum > target) {
        right -= 1;
      } else {
        result.push([nums[i], nums[left], nums[right]]);
        const leftValue = nums[left];
        const rightValue = nums[right];
        while (left < right && nums[left] === leftValue) left += 1;
        while (left < right && nums[right] === rightValue) right -= 1;
      }
    }
  }

  return result;
}
```

排序为 `O(n log n)`，外层枚举与双指针合计 `O(n²)`，所以总时间复杂度为 `O(n²)`；额外空间取决于排序实现与返回结果。

#### 12. 两张图像差异的最小包围矩形

若输入是两张同尺寸图像，并要求一个矩形覆盖全部差异像素，只需扫描全部像素并维护四个边界：

```javascript
function diffBounds(imageA, imageB, isDifferent) {
  const height = imageA.length;
  const width = height === 0 ? 0 : imageA[0].length;
  let minRow = height;
  let maxRow = -1;
  let minCol = width;
  let maxCol = -1;

  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      if (!isDifferent(imageA[row][col], imageB[row][col])) continue;
      minRow = Math.min(minRow, row);
      maxRow = Math.max(maxRow, row);
      minCol = Math.min(minCol, col);
      maxCol = Math.max(maxCol, col);
    }
  }

  return maxRow === -1
    ? null
    : {top: minRow, left: minCol, bottom: maxRow, right: maxCol};
}
```

时间复杂度为 `O(HW)`，除返回值外空间为 `O(1)`。编码前应确认逐通道精确比较还是允许误差、边界采用闭区间还是半开区间，以及多个不连通差异是共用一个总包围框还是分别求连通分量。

#### 13. 无重复字符的最长子串：可变窗口

子串要求连续，不能通过删除中间字符得到。维护一个不含重复字符的窗口 `[left, right]`：每读到字符，查询它上一次出现的位置；如果仍在当前窗口中，就把左边界移到上次位置之后。左边界只能前进，不能退回。例如 `abba` 处理最后一个 `a` 时，旧位置已经在窗口外，不能把 `left` 从 2 改回 1。

以下教学接口返回按 Unicode 码点计的长度，不是完整原题的输入输出约定。[ECMAScript 的字符串迭代器](https://tc39.es/ecma262/multipage/text-processing.html#sec-string.prototype-@@iterator)按码点迭代；码点也不一定等于用户看到的一个字素，例如组合音标或连字 emoji。若题目按字节、UTF-16 码元或字素计数，应统一遍历与结果单位。

```javascript
function longestUniqueSubstringLength(text) {
  const lastSeen = new Map();
  let left = 0, right = 0, best = 0;
  for (const char of text) {
    const previous = lastSeen.get(char);
    if (previous !== undefined) left = Math.max(left, previous + 1);
    lastSeen.set(char, right);
    best = Math.max(best, right - left + 1);
    right += 1;
  }
  return best;
}
```

空字符串返回 0，全部相同字符返回 1，`abba` 返回 2，`😀a😀` 按码点计返回 2。若需要实际子串，再记录最优区间并用同一字符单位截取。在抽象哈希表操作平均 O(1) 的模型下，时间 O(n)、空间 O(min(n, 字符种类数))；每个位置只推进一次，不需要为每个起点重新扫描。

#### 14. 有序数组中 target 的首末位置：两个二分边界

先确认排序方向和返回合同。下面的教学接口约定：数组按非降序排列，元素与 target 是可精确比较的有限数值；返回从0开始的闭区间索引，不存在时返回 `[-1, -1]`，不修改输入。调用期间输入不发生并发修改。它不负责先扫描验证整数组是否有序；若增加该校验，要把 O(n) 成本计入总流程。

[Python bisect 官方文档](https://docs.python.org/3/library/bisect.html)把两个边界定义为插入位置：lower bound 左侧都小于 target、右侧都大于等于；upper bound 左侧都小于等于 target、右侧都大于。它们即使在 target 不存在时仍返回合法插入点，因此必须另外检查是否命中。

搜索维护元素区间 `[lo, hi)`，最终插入点可以落在其端点。查 lower 时，`[0, lo)` 已知 `< target`，`[hi, n)` 已知 `>= target`；查 upper 时，分别改为 `<= target` 和 `> target`。有序性保证中点可以排除整段，且每轮区间严格缩小，最后 lo 等于 hi 就是边界。

```javascript
function orderedBound(nums, target, upper) {
  let lo = 0, hi = nums.length;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (nums[mid] < target || (upper && nums[mid] === target)) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo;
}

function findTargetRange(nums, target) {
  const first = orderedBound(nums, target, false);
  if (first === nums.length || nums[first] !== target) return [-1, -1];
  return [first, orderedBound(nums, target, true) - 1];
}

console.log(findTargetRange([1, 2, 2, 2, 4], 2)); // [1, 3]
console.log(findTargetRange([], 2));              // [-1, -1]
console.log(findTargetRange([1, 3], 2));          // [-1, -1]
```

不能找到任意一个相等元素后就返回，也不要用 `target + 1` 替代 upper bound，这对最大整数或非整数合同并不可靠。中点按索引计算，避免把 JS 位运算的32位截断引入大数组索引。单次查找时间 O(log n)、额外空间 O(1)；输入无序或比较规则不稳定时，上述不变量不成立。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [百度后端一面：延迟诊断、工具恢复与滑动窗口](../../../interview/baidu/ai/baidu-ai-10.md)
- [腾讯云 CSIG 后台一面：Skill 边界与有序查找](../../../interview/tencent/ai/tencent-ai-23.md)
- [字节 Agent 一面：会话记忆、并发更新与算法](../../../interview/bytedance/base/bytedance-base-29.md)
- [字节 AI 平台一面：Agent 评测、框架与数据结构](../../../interview/bytedance/base/bytedance-base-33.md)
- [字节 Agent：幻觉、任务恢复与 Java 基础](../../../interview/bytedance/base/bytedance-base-50.md)
- [快手大模型应用算法社招一面：Diffusion 与二分基础](../../../interview/kuaishou/ai/kuaishou-ai-19.md)
- [字节全栈二、三面：幂等、索引与字符串匹配](../../../interview/bytedance/base/bytedance-base-32.md)
<!-- interview-source-history:end -->

## 参考资料

- [ECMAScript Array Objects](https://tc39.es/ecma262/multipage/indexed-collections.html#sec-array-objects)
- [Introduction to Competitive Programming — Purdue University](https://www.cs.purdue.edu/homes/ninghui/courses/390_Fall19/lectures.html)
- [COS 226 Advanced Precept 5 Instructor Notes — Princeton University](https://www.cs.princeton.edu/courses/archive/spring26/cos226/precepts/advanced-precept5.pdf)
- [ECMAScript：String Iterator](https://tc39.es/ecma262/multipage/text-processing.html#sec-string.prototype-@@iterator)
- [Python：bisect 的左右插入边界](https://docs.python.org/3/library/bisect.html)
