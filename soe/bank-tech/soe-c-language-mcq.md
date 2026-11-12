指针题先辨认“指针对象、保存的指针值、指向的对象”三件事，再沿类型和边界计算。本篇把指针、数组、结构体和内存访问转换为选择题；“常考点”表示基础复习重点，不代表已统计某家招聘考试的出题频率。练习题按高频考点编排。

语义范围固定为 C11 的基础规则，参考公开的 [WG14 N1570 委员会草案](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)，不混入 C++ 引用、容器或 GNU 特有扩展。示例若依赖类型大小、对齐或 ABI，会在题干单独声明；不能把本机运行结果当作所有实现的保证。

## 先补哪篇已有文章

| 前提 | 复用文章 | 本篇新增的练习角度 |
| --- | --- | --- |
| 对象、作用域、自动/静态/线程/分配存储期 | [C 对象与存储期](../../knowledge/cs/language/c-object-storage-duration.md) | 区分指针的复制、所指对象的修改和释放后的别名 |

生命周期机制由已有文章解释，下面专注表达式类型、地址步长、布局计算与错误选项辨析。

## 指针加一，究竟跨过什么

`int *p` 声明一个指针对象；`p` 的值用于定位 `int` 对象，`*p` 才访问所指对象。若 `p` 指向某数组元素，合法的 `p+1` 前进一个元素，字节步长为 `sizeof *p`。标准 C 不允许对 `void *` 做这种算术，不要把编译器扩展当作语言规则。[GNU：Pointer Arithmetic](https://www.gnu.org/software/c-intro-and-ref/manual/html_node/Pointer-Arithmetic.html)给出了按元素移动与同数组指针相减的说明。

同一数组内两个指针相减得到元素距离，结果类型为 `ptrdiff_t`。它不是字节差；相减还要求结果可由该类型表示。不同独立数组即使地址看起来相邻，也不能据此相减。

设 `int a[4] = {2, 4, 6, 8}; int *p = a + 1;`。下面把数组对象和指针对象分开画，尾后位置只用来确定范围，不是第五个可访问元素。

![C 数组 a 的四个元素为 2、4、6、8，指针对象 p 指向 a[1]；a+4 是不可解引用的尾后位置](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/soe-c-language-mcq-array-pointers-v1.png)
*图：数组对象与指针对象分开表示。间距只帮助看清元素关系，不表示实际指针编码或分配器布局。*

数组边界包含一个特殊位置：可以形成 `a+4` 这个尾后指针，用于循环终止等判断；不能通过它读取或写入元素，也不能继续形成 `a+5`。越界不一定等到解引用时才发生。[SEI CERT ARR30-C](https://cmu-sei.github.io/secure-coding-standards/sei-cert-c-coding-standard/rules/arrays-arr/arr30-c/)专门区分形成越界指针和访问尾后位置。

### 高频考点题 1：先求元素，再求距离

对上述 `a` 和 `p`，表达式 `*(p + 2) + (p - a)` 的值是多少？

- A. 8
- B. 9
- C. 12
- D. 不能确定，因为未给 `sizeof(int)`

**答案：B。** `p` 指向 `a[1]`，`p+2` 指向 `a[3]`，读取值为 8；`p-a` 是一个元素的距离，等于 1。因此结果为 9。这里的计算不需要知道 `int` 的字节数，D 把元素距离误当成地址字节差。

### 高频考点题 2：哪种边界操作有定义

`a` 仍是包含 4 个元素的数组。下列哪一项本身合法，且不访问不存在的元素？

- A. 读取 `*(a + 4)`
- B. 形成 `int *end = a + 4;`，并用 `end == a + 4` 比较
- C. 形成 `int *far = a + 5;`，只要不解引用就安全
- D. 读取 `a[-1]`，只要前面还有可用内存就安全

**答案：B。** 尾后指针可以形成和比较。A、D 访问数组范围之外；C 的指针算术结果已经超出同一数组及尾后位置的允许范围。“没崩溃”不能证明行为有定义。

## 数组与指针，哪些时候不能等同

数组对象保存一组连续元素，指针对象保存指针值。数组表达式在多数使用场景会转换为指向首元素的指针，但这不使两种对象变成同一种类型。对真正的数组做 `sizeof`，得到整个数组的字节数；取地址 `&a`，得到指向整个数组的指针，类型为 `int (*)[4]`。[N1570 §6.3.2.1、§6.5.3.4](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)是这里的规则依据。

| 声明或表达式 | 应读成什么 | 容易混淆的地方 |
| --- | --- | --- |
| `int a[4]` | 4 个 `int` 的数组 | `a` 不是可重新赋值的指针变量 |
| `int *p` | 指向 `int` 的指针 | `sizeof p` 不是被指向数组的容量 |
| `int *v[3]` | 3 个 `int *` 的数组 | `[]` 先与 `v` 结合 |
| `int (*r)[3]` | 指向“3 个 `int` 的数组”的指针 | `r+1` 跨过一整行 |

函数形参中的数组声明会调整为指针声明。例如 `void f(int x[5])` 的 `x` 是指针形参，并不会自动携带实参长度。需要长度时应另外传入元素个数；这里不讨论形参 `static` 最小元素数约束或变长数组的额外规则。

### 高频考点题 3：形参中的 sizeof

已知本题实现中 `sizeof(int)==4`、`sizeof(int *)==8`，忽略所有扩展，执行下列程序输出什么？

```c
#include <stdio.h>

static void inspect(int x[5]) {
    printf("%zu\n", sizeof x);
}

int main(void) {
    int a[5] = {0};
    printf("%zu ", sizeof a);
    inspect(a);
    return 0;
}
```

- A. `20 20`
- B. `8 8`
- C. `20 8`
- D. `5 5`

**答案：C。** `main` 中的 `a` 是真实数组，大小为 `5×4=20` 字节；`inspect` 中的 `x` 已调整为 `int *`，所以为 8 字节。编译器可能对 `sizeof` 数组形参发出警告，这正是本题考察的区别。`sizeof a / sizeof a[0]` 只能在 `a` 仍具有数组类型的位置求元素数。

### 高频考点题 4：二维数组按行前进

本题 `sizeof(int)==4`。给定：

```c
int matrix[2][3] = {{1, 4, 7}, {2, 5, 8}};
int (*row)[3] = matrix + 1;
```

`row[0][1]` 与 `sizeof *row` 分别是多少？

- A. 4 与 4
- B. 5 与 12
- C. 8 与 8
- D. 5 与指针大小

**答案：B。** `matrix` 是两个“3 个 `int` 的数组”组成的数组，转换后的指针指向第一行；`matrix+1` 指向第二行。`row[0][1]` 即第二行的第二个元素 5。`*row` 的类型是 `int[3]`，在 `sizeof` 中保留数组类型，大小为 12。

[GNU：Multidimensional Arrays](https://www.gnu.org/software/c-intro-and-ref/manual/html_node/Multidimensional-Arrays.html)解释了这种数组的数组模型。连续布局不意味着可以用超出某一行边界的下标访问下一行；例如本题 `matrix[0][3]` 仍然越过了第一行的边界。

## 字符数组、字符串字面量与 const 怎么辨别

`char text[] = "bot";` 创建含结尾空字符的可修改数组；`const char *view = "bot";` 创建指向字符串字面量的指针。二者都能被读取为字符串，但数组可修改不代表字面量可修改。`strlen` 数的是第一个 `\0` 前的字符数，`sizeof` 数的是对象大小。

`const int *p` 约束经由 `p` 修改所指整数；`int * const p` 约束指针对象本身不能重新赋值。前者并不保证整数不能经其他合法别名修改，后者也不保证整数不可变。[N1570 §6.4.5、§6.7.3](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)分别规定字面量与类型限定符的边界。

### 高频考点题 5：长度不是存储容量

对于 `char text[] = "bot"; const char *view = "bot";`，哪项正确？本题不对指针大小作假设。

- A. `sizeof text` 与 `strlen(text)` 都为 3
- B. `text[0] = 'B';` 必然修改 `view` 所指的字面量
- C. `sizeof text` 为 4，`strlen(text)` 为 3；可修改 `text[0]`
- D. 强制去掉 `view` 的 `const` 后，写字面量就有定义

**答案：C。** 数组的第四个字符是结尾 `\0`，它计入容量、不计入 `strlen`。初始化产生独立数组，修改该数组不会把字面量变成可写对象。强制类型转换也不能使修改字面量合法；`sizeof view` 只会得到指针大小。

## 结构体大小为什么不能只加字段

先确认成员顺序、每种类型的大小与对齐，再依题目给定的布局规则安排偏移，最后考虑尾部填充。标准允许结构体成员之间和末尾有填充，但不在开头添加这种未命名填充；具体数值由目标实现决定。常见平台按成员的对齐需求留空，再将总大小补到结构体对齐的倍数，可参阅 [GNU：Structure Layout](https://www.gnu.org/software/c-intro-and-ref/manual/html_node/Structure-Layout.html)。这套常见 ABI 算法必须作为题设，不能反推为所有 C 实现的唯一布局。

### 高频考点题 6：明确 ABI 后计算偏移

题设：`char` 大小/对齐为 1/1，`short` 为 2/2，`int` 为 4/4；每个成员放到满足自身对齐的最小偏移，结构体对齐取成员最大对齐，总大小向该对齐取整；没有额外对齐、位域或打包指令。

```c
struct Packet {
    char flag;
    int count;
    short type;
};
```

`count` 的偏移、`type` 的偏移和 `sizeof(struct Packet)` 依次是多少？

- A. 1、5、7
- B. 4、8、10
- C. 4、8、12
- D. 8、12、16

**答案：C。** `flag` 占偏移 0；为对齐 `count`，偏移 1～3 留空，`count` 占 4～7；`type` 占 8～9；末尾 10～11 填充，使总大小成为 4 的倍数。因此结构体数组中的下一个元素仍能满足对齐。

| 范围 | 内容 |
| --- | --- |
| 0 | `flag` |
| 1～3 | 内部填充 |
| 4～7 | `count` |
| 8～9 | `type` |
| 10～11 | 尾部填充 |

真实程序可以用 `offsetof`、`sizeof` 与 `_Alignof` 观察当前实现。成员赋值复制值；即便两个结构体成员值相等，也不宜用 `memcmp` 比较整个对象来断言逻辑相等，因为填充字节不等价于业务字段。跨进程或网络传输应定义明确的序列化格式，另行约定字节序。

## 修改对象与修改指针，是同一次修改吗

C 的函数参数也是按值传递。给指针形参重新赋值，不会替调用方的指针对象赋值；通过仍有效的指针访问同一个对象，则可能让调用方看到该对象变化。把“能间接修改”说成“参数变量就是调用方变量”，会误判空指针设置、交换指针与分配函数。

### 高频考点题 7：给形参置空会影响谁

```c
#include <stddef.h>

static void change(int *p) {
    *p = 11;
    p = NULL;
}

/* 以下片段位于 main 中 */
int value = 3;
int *caller = &value;
change(caller);
```

调用结束后，哪项正确？

- A. `value==3`，`caller==NULL`
- B. `value==11`，`caller==&value`
- C. `value==11`，`caller==NULL`
- D. `value` 的生命周期已经结束

**答案：B。** 进入 `change` 时，`p` 收到指针值的副本；`*p=11` 修改的是仍存活的 `value`，`p=NULL` 仅改形参。若 API 需要改写调用方的指针，可返回新指针由调用方接收，或明确传入适当的二级指针；这仍然没有改变参数按值传递的规则。

### 高频考点题 8：置空一个别名，不会修复全部别名

下列片段只讨论 `malloc` 成功的分支：

```c
#include <stdlib.h>

int *p = malloc(sizeof *p);
if (p != NULL) {
    *p = 6;
    int *alias = p;
    free(p);
    p = NULL;
    /* 停在这里：没有再求值 alias */
}
```

此处哪项判断正确？

- A. `p=NULL` 会自动把 `alias` 置空
- B. `*alias` 仍然有定义，因为它是另一个指针
- C. 分配对象已经释放，不能再通过 `alias` 读取它
- D. 离开块时必须再次 `free(alias)`，否则泄漏

**答案：C。** 两个指针曾保存同一分配结果，复制指针没有复制被分配对象。释放结束该对象的生命周期；给 `p` 赋值不修改 `alias`，也不恢复被释放的对象。D 会造成重复释放。不要靠读取已失效指针的值来证明它“仍指向可用地址”。[GNU：Dynamic Memory Allocation](https://www.gnu.org/software/c-intro-and-ref/manual/html_node/Dynamic-Memory-Allocation.html)讨论了释放后停止使用对象，以及在释放前保存后续遍历所需信息的要求。

## 遇到输出题，先排除没有确定答案的程序

并非所有输出题都应该给一个数字：

| 题干信号 | 先作什么判断 |
| --- | --- |
| 同一完整表达式中多次改变同一标量，且彼此未排序 | 例如 `i++ + ++i`，不能仅说“从左往右算”或“顺序未指定” |
| 读取未初始化对象、悬空对象或越界元素 | 先核对对象是否可合法访问 |
| 依赖整数宽度、指针大小、结构体布局 | 要求明确实现条件，或给条件化结论 |
| `*p++` 与 `(*p)++` | 前者按 `*(p++)` 解析，后者修改所指值；仍需合法指针范围与有效对象 |

未定义行为表示标准不对该次程序行为提供要求，不等于“固定输出随机数”，也不等于必然崩溃。对有定义的片段再逐步跟踪状态，才是有效的手算。[N1570 §6.5](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)规定了未排序副作用的相关限制。

## 做题自检

先写表达式类型，再问 `sizeof` 面对的是数组还是指针；做指针算术时标注所属数组和尾后位置；遇到结构体先列 ABI 假设；最后检查生命周期与未定义行为。四步全部成立，输出和大小计算才有可比较的答案。位域布局、柔性数组成员、复杂声明器和 C23 新特性需要单独的题设，本篇不扩展。

## 参考资料

- [WG14 N1570：C11 委员会草案](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)：§6.3.2.1、§6.4.5、§6.5、§6.5.3.4、§6.5.6、§6.7.2.1、§6.7.3、§6.7.6.3、§7.22.3。
- [GNU C Language Manual：Pointer Arithmetic](https://www.gnu.org/software/c-intro-and-ref/manual/html_node/Pointer-Arithmetic.html)：按元素移动与指针差。
- [GNU C Language Manual：Multidimensional Arrays](https://www.gnu.org/software/c-intro-and-ref/manual/html_node/Multidimensional-Arrays.html)：数组的数组与指向行的指针。
- [GNU C Language Manual：Structure Layout](https://www.gnu.org/software/c-intro-and-ref/manual/html_node/Structure-Layout.html)：平台相关的成员对齐和填充。
- [GNU C Language Manual：Dynamic Memory Allocation](https://www.gnu.org/software/c-intro-and-ref/manual/html_node/Dynamic-Memory-Allocation.html)：分配、失败检查与释放后的访问边界。
- [SEI CERT C：ARR30-C](https://cmu-sei.github.io/secure-coding-standards/sei-cert-c-coding-standard/rules/arrays-arr/arr30-c/)：禁止形成越界指针或使用越界下标。
