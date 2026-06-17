#### 1. 查找数组中的最大值
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



#### 3. 归并两个排序数组
**问题**：合并两个已排序的数组，使合并后的数组也是有序的。  
**解法**：使用双指针从后向前归并。

```javascript
const merge = (arr1, arr2) => {
  let result = [];
  let i = arr1.length - 1;
  let j = arr2.length - 1;

  while (i >= 0 && j >= 0) {
    if (arr1[i] > arr2[j]) {
      result.push(arr1[i--]);
    } else {
      result.push(arr2[j--]);
    }
  }

  // 将剩余元素添加到结果数组中
  return result.concat(i >= 0 ? arr1.slice(0, i + 1) : arr2.slice(0, j + 1));
};

const arr1 = [1, 3, 5];
const arr2 = [2, 4, 6];
console.log(merge(arr1, arr2)); // [1, 2, 3, 4, 5, 6]
```



#### 4. 找出数组中第K大的元素
**问题**：找出数组中第K大的元素。  
**解法**：使用快速选择算法（类似于快速排序）。

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
  const low = 0;
  const high = arr.length - 1;
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
**问题**：给定两个有序整数数组，在原地合并它们，使它们成为一个有序数组。  
**解法**：从后向前填充较小的元素。

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

