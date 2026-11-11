Java 基础选择题常把不同层次的规则放进同一个选项：编译时选哪个方法、运行时执行哪个实现、变量复制了什么，以及某个集合操作是否受支持。做题时先判编译是否合法，再推演运行结果。本篇补充这些考法；以下 8 题均为**单选**，代码按 Java SE 21 规则分析，不代表任何招聘考试的原题或出题频率。

## 先用已有文章补前提

| 需要补的前提 | 已有文章 | 本篇新增的练习角度 |
| --- | --- | --- |
| 参数、字符串、返回结果 | [Java 值语义：参数、字符串与返回](../../knowledge/backend/java/java-value-semantics.md) | 区分对象修改、形参重绑和已求值的返回值 |
| List、Set、Map 的合同 | [Java 集合：接口分类与选型](../../knowledge/backend/java/java-collections.md) | 判断重载、固定长度视图、去重和覆盖 |
| JVM 逻辑区域、类加载与内存故障 | [JVM 内存、类加载与 OOM 定位](../../knowledge/backend/java/java-runtime-memory.md) | 结合 HotSpot 版本和类加载器生命周期排除错误归因 |

这些文章负责展开机制，下面只保留解题所需的规则和推演。

## 面向对象题：先选签名，再找实现

封装关心成员的可见性和可用操作，继承带来父类型合同，实例方法重写使父类型引用可以执行子类实现。它们不能替代具体的语言规则：同名但参数列表不同通常是在**重载**；符合重写条件的实例方法才参与相应的动态分派。重写还不能缩小访问权限，也不能任意扩大受检异常范围。[JLS 21 §8.4.8.3、§8.4.9](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.8.3)

对本篇这种参数已经有确定类型的普通调用，先依据编译时可见的方法和实参表达式选择签名，再在运行时寻找该签名的重写实现。不能看到对象是子类实例，就把子类所有重载都加入这次调用的候选集合。[JLS 21 §15.12.2](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12.2)、[§15.12.4.4](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12.4.4)

### 高频考点题 1：实际对象能否改变重载选择

```java
class Parent {
    String tag(Object x) { return "P"; }
}
class Child extends Parent {
    @Override
    String tag(Object x) { return "C"; }
    String tag(String x) { return "S"; }
}
public class DispatchQuiz {
    public static void main(String[] args) {
        Parent service = new Child();
        Object value = "ok";
        System.out.println(service.tag(value) + ":" + service.tag("ok"));
    }
}
```

输出是什么？

- A. `P:P`
- B. `C:S`
- C. `C:C`
- D. 编译失败，因为父类引用不能指向子类对象

**答案：C。** 两次调用的接收表达式 `service` 的编译时类型都是 `Parent`，其可用方法是 `tag(Object)`；第二次的字符串也可传给这个参数。运行时对象是 `Child`，因此两次都执行 `Child.tag(Object)`。`tag(String)` 是另一个重载，没有重写父类的 `tag(Object)`，不会在运行时重新参与选签名。A 忽略了重写，B 把重载选择推迟到了运行时，D 否定了合法的向上转型。

## 参数题：复制引用值，仍然是值传递

**Java 始终按值传递。** 方法入口用实参值初始化新建的形参变量；引用类型参数复制的是引用值。两个变量因此可以指向同一数组，修改数组元素会被双方观察到；重新赋值形参则只改变形参本身。[JLS 21 §15.12.4.5](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12.4.5)

`String` 对象不可变，字符串拼接得到结果字符串，并不原地修改旧字符串。必须把“变量改为指向另一个字符串”与“修改已有对象的内容”区分开。[Java 21 String API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html)

图中应先看方法入口的共享指向，再沿题目语句判断究竟改了对象，还是改了某个变量。

![Java 方法入口中，调用方 nums 和形参 a 共同指向数组 A，调用方 text 和形参 s 共同指向不可变字符串 S；形参获得引用值的副本](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/soe-java-mcq-reference-values-v1.png)
*图：这是方法入口的逻辑关系快照。后续修改 A 的元素能被 nums 观察到；给 a 或 s 赋新引用值，不会重绑调用方变量。*

### 高频考点题 2：数组和 String 为什么表现不同

```java
import java.util.Arrays;

public class ValueQuiz {
    static void change(int[] a, String s) {
        a[0] = 9;
        a = new int[] {7, 8};
        s = s + "!";
    }
    public static void main(String[] args) {
        int[] nums = {2, 5};
        String text = "ab";
        change(nums, text);
        System.out.println(Arrays.toString(nums) + ":" + text);
    }
}
```

- A. `[2, 5]:ab`
- B. `[9, 5]:ab`
- C. `[7, 8]:ab!`
- D. `[9, 5]:ab!`

**答案：B。** 方法入口时，`a` 与 `nums` 指向同一个数组 A，`s` 与 `text` 指向同一个字符串 S。第一条语句修改 A 的首元素；第二条语句只让 `a` 指向新数组，`nums` 仍指向 A；第三条语句只让 `s` 指向拼接结果，`text` 仍指向内容为 `ab` 的 S。

A 忽略了共享数组的修改；C、D 把形参赋值当成了调用方变量赋值。这个结果不能概括为“数组按引用传递、String 按值传递”：两者都复制引用值，区别在于对象能否修改以及语句做了什么。

## 异常题：编译合同与运行控制流分别判断

`RuntimeException` 及其子类、`Error` 及其子类属于非受检异常；其余 `Throwable` 类型属于受检异常。常见受检异常如 `IOException`，需要按编译规则捕获或声明。`throws` 声明可能传播的异常，不表示调用时必然抛出；`catch (Exception e)` 也不会因此捕获 `Error`。[JLS 21 §11.1.1、§11.2](https://docs.oracle.com/javase/specs/jls/se21/html/jls-11.html#jls-11.1.1)

多个 `catch` 按顺序匹配，不能把能捕获子类的父类处理器放在前面，再写已被覆盖的子类处理器。例如同一个 `try` 后先捕获 `IOException`、再捕获 `FileNotFoundException`，后一个分支不能通过编译检查。[JLS 21 §11.2.3](https://docs.oracle.com/javase/specs/jls/se21/html/jls-11.html#jls-11.2.3)

### 高频考点题 3：哪个重写满足父类合同

父类定义如下，各选项分别作为 `class DetailSource extends Source` 的唯一方法。哪个合法？

```java
class Source {
    protected void load() throws java.io.IOException {}
}
```

- A. `public void load() throws java.io.FileNotFoundException {}`
- B. `private void load() throws java.io.IOException {}`
- C. `public void load() throws Exception {}`
- D. `public int load() throws java.io.IOException { return 1; }`

**答案：A。** `public` 没有缩小访问权限，`FileNotFoundException` 是 `IOException` 的子类，因此受检异常范围也没有扩大。B 缩小了可见性；C 扩大为 `Exception`；D 不能靠把返回类型从 `void` 改成 `int` 来重载或合法重写相同参数的方法。重写也可以不声明受检异常，父类允许抛出不等于子类必须抛出。[JLS 21 §8.4.8.3](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.8.3)

### 高频考点题 4：finally 改局部变量会改返回值吗

下面是类内的一个方法，调用 `score()` 的返回值是什么？

```java
static int score() {
    int n = 3;
    try {
        return n;
    } finally {
        n = 8;
    }
}
```

- A. 3
- B. 8
- C. 编译失败，因为 `finally` 中不能赋值
- D. 方法没有返回值

**答案：A。** `return n` 先求值得到基本类型值 3，然后执行 `finally`。`finally` 正常结束，保留先前的返回结果；它修改局部变量 `n` 不会重新计算返回表达式。若 `finally` 自己执行 `return 8`，才会覆盖先前结果；若它抛出异常，则可能覆盖原先的返回或异常。不能由本题推出“finally 永远不影响返回”。[JLS 21 §14.20.2](https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.20.2)

## 集合题：把接口、元素规则和可修改性分开

List 的位置顺序不等于自动排序；Set 去重不等于所有实现都无遍历顺序；Map 的 key 唯一也不要求 value 唯一。接口体系详见前面的[集合文章](../../knowledge/backend/java/java-collections.md)。代码题还要核对具体方法合同：

| 调用或创建方式 | 解题时应抓住的区别 |
| --- | --- |
| `list.remove(1)` | 匹配 `remove(int index)`，按下标删除 |
| `list.remove(Integer.valueOf(1))` | 匹配 `remove(Object)`，删除首个相等元素 |
| `Arrays.asList(array)` | 固定长度且与数组关联的视图，可替换元素，不能改变长度 |
| `new ArrayList<>(collection)` | 创建可增删的列表；不要把它与原集合视为同一个容器 |
| `List.of(...)` | 不可修改的列表，不能增、删、替换元素；元素对象自身是否可变是另一回事 |

`remove` 的两个重载及不可修改列表由 [List API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html)定义；固定长度视图及数组联动由 [Arrays.asList API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Arrays.html#asList(T...))定义；从集合创建新列表的合同见 [ArrayList API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ArrayList.html)。

### 高频考点题 5：固定长度不等于不能替换元素

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class ListQuiz {
    public static void main(String[] args) {
        Integer[] raw = {4, 7, 4};
        List<Integer> view = Arrays.asList(raw);
        view.set(1, 9);
        List<Integer> values = new ArrayList<>(view);
        values.remove(1);
        values.remove(Integer.valueOf(4));
        System.out.println(raw[1] + ":" + values);
    }
}
```

- A. `7:[4]`
- B. `9:[9]`
- C. 执行 `view.set` 时抛出 `UnsupportedOperationException`
- D. `9:[4]`

**答案：D。** `set` 不改变长度，合法且使 `raw[1]` 变成 9。复制后的 `values` 起初为 `[4, 9, 4]`；`remove(1)` 删除下标 1 的 9，得到 `[4, 4]`；`remove(Integer.valueOf(4))` 再删除首个值为 4 的元素，留下 `[4]`。后续操作发生在新 `ArrayList`，不改变 `raw` 的长度或元素。A 漏掉数组联动，B 混淆删除的目标，C 把固定长度视图误当成不可修改列表。

### 高频考点题 6：不同对象不必成为不同 key

```java
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class KeyQuiz {
    public static void main(String[] args) {
        Set<String> codes = new HashSet<>();
        codes.add("C1");
        codes.add(new String("C1"));
        Map<String, Integer> counts = new HashMap<>();
        counts.put("a", 5);
        counts.put(new String("a"), 8);
        counts.put("b", 8);
        System.out.println(codes.size() + ":" + counts.size() + ":" + counts.get("a"));
    }
}
```

- A. `2:3:5`
- B. `1:2:8`
- C. `1:1:8`
- D. `2:2:8`

**答案：B。** 两个 `C1` 字符串内容相等，`HashSet` 只保留一个成员；第二次向 key `a` 写入时更新已有映射，随后 key `b` 增加另一项，所以 Map 大小为 2。两个 value 同为 8 不会让映射合并。A、D 把对象身份当作字符串的相等性，C 把 value 相同也当成 key 重复。这里没有遍历 Map，因此答案不依赖其遍历顺序。[String.equals](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html#equals(java.lang.Object))、[HashSet.add](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashSet.html#add(E))、[HashMap.put](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html#put(K,V))

## 内存题：先看 HotSpot 版本，再看什么持续存活

永久代与元空间是实现和版本相关的考点。HotSpot 在 JDK 8 移除了永久代，类元数据转向本地内存中的元空间；不能把 JDK 7 的 `PermGen space` 与 JDK 21 的 `Metaspace` 混为同一种当前配置，也不能把 JVM 规范中的“方法区”直接当作某个实现名称。同样的无界普通类定义和类加载器保活，在旧版 HotSpot JDK 7 中可能形成永久代压力，并在相应空间耗尽时出现 `OutOfMemoryError: PermGen space`；JDK 8 及以后则应检查元空间等对应资源。[JEP 122：Remove the Permanent Generation](https://openjdk.org/jeps/122)、[Oracle JDK 7：PermGen space 故障说明](https://docs.oracle.com/javase/7/docs/webnotes/tsg/TSG-VM/html/memleaks.html#gbyuu)

动态生成类只是增长来源之一。要推断元空间可能耗尽，还要检查：是否持续定义新的类、旧类是否具备卸载条件，以及元空间上限或可用本地内存是否足以承载增长。对题设中的普通命名类，定义它的类加载器仍被长期保活，会使这些类不满足卸载条件；丢弃普通业务实例不等于类元数据立即回收。[JLS 21 §12.7](https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html#jls-12.7)

### 高频考点题 7：没有堆满，为什么仍可能 OOM

一个 HotSpot JDK 21 服务设置了有限的 `-XX:MaxMetaspaceSize`。每次请求都定义一个新名称的普通类；这些类的定义类加载器始终由全局缓存强引用，已加载类数量持续增加。堆仍有较多空闲，但新的类元数据已无法在元空间上限内分配。下列判断最准确的是哪项？

- A. 堆未满就不可能出现 `OutOfMemoryError`
- B. 类元数据压力应通过增大 `-XX:MaxPermSize` 解决，因为 JDK 21 仍使用永久代
- C. 符合元空间耗尽的条件，应检查无界类生成和类加载器保活；增大 `-Xmx` 不保证解决
- D. 只要丢弃每个请求创建的普通对象，相关类一定会立即卸载

**答案：C。** 题设已经给出“类持续增长、加载器存活、有限元空间无法继续分配”三项证据，定位对象是类元数据，不能因为堆有空闲就否定 OOM。JDK 21 的对应故障可表现为 `OutOfMemoryError: Metaspace`。A 把堆当成全部进程内存，B 套用了旧版本参数，D 混淆对象回收与类卸载。

实际修复需要限制不必要的新类生成、检查缓存是否错误延长加载器生命周期，并按业务工作集评估容量；“用了动态代理就必然溢出”也不成立，必须结合生成策略和存活条件判断。[Oracle Java 21：内存泄漏诊断中的 Metaspace 与类加载器统计](https://docs.oracle.com/en/java/javase/21/troubleshoot/troubleshooting-memory-leaks.html)

## 对象后缀题：命名约定不是 Java 类型系统

DO、DTO、PO、VO 是工程里的角色命名约定，不是 Java 关键字或编译器规定的四种对象。下面采用一组明确的题设约定；不能由类名后缀推出它必须继承哪个类、实现哪个接口或存放在哪个内存区。

| 后缀 | 本题组采用的含义 | 先问清的边界 |
| --- | --- | --- |
| DO | Data Object，按约定承载与表结构对应的数据 | 其他题若明确把 DO 定义为 Domain Object，应按其领域对象约定解题 |
| DTO | Data Transfer Object，承载接口或层间需要传递的数据 | 传输职责不等于必须暴露全部持久化字段 |
| PO | Persistent Object，题设约定的持久化对象 | 是否与表一一对应、怎样映射，应由项目规定 |
| VO | View Object，面向展示的对象 | 另一个语境中 VO 也可能指 Value Object，不能只凭缩写判断 |

DO、DTO、View Object 的一种分层命名示例可见[《Java 开发手册》的领域模型约定](https://alibaba.github.io/Alibaba-Java-Coding-Guidelines/)。Value Object 强调按值而非独立身份区分对象，例如按币种和金额判断相等；它描述建模语义，与“页面展示对象”不是一回事。[Value Object 的原始模式说明](https://martinfowler.com/bliki/ValueObject.html)

### 高频考点题 8：同一个 VO 缩写能否直接套定义

某项目文档约定：DO 承载表数据，PO 表示持久化映射，DTO 用于服务接口传输，VO 表示页面展示。另外，设计说明把按“币种＋金额”比较相等的 `Money` 称为 Value Object。哪个说法正确？

- A. `AccountDTO` 必须实现 `java.io.Serializable`，否则 Java 编译器会拒绝它
- B. 既然 VO 表示页面展示对象，`Money` 就不能被称为 Value Object
- C. 只要把类名从 `AccountPO` 改为 `AccountDTO`，JVM 就会自动改变其存储区域
- D. 应按文档区分传输、展示、持久化和按值建模的职责，后缀本身不建立语言级约束

**答案：D。** 本题明确给出了项目约定，`VO` 的展示含义与 `Value Object` 的建模含义可以在各自语境中成立。DTO 是否需要某个序列化接口取决于实际传输机制，不能由 DTO 这个后缀推出；类改名也不改变 JVM 的对象分配规则。A、C 把工程约定误当语言或运行时机制，B 忽略缩写的语境。

## 做完后检查四件事

先判编译合同，再判运行分派；先确定复制的值，再判断是否修改共享对象；先查集合的具体方法，再看输出；先标明 JVM 版本和资源区域，再解释故障。遇到 DO、VO 等缩写，回到题干约定，缺少约定时不要把某一项目习惯写成语言标准。

## 参考资料

- [JLS 21 第 8 章：类、重写约束与重载](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html)
- [JLS 21 第 11 章：异常分类与编译检查](https://docs.oracle.com/javase/specs/jls/se21/html/jls-11.html)
- [JLS 21 §14.20.2：try/finally 的完成规则](https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.20.2)
- [JLS 21 §15.12：方法调用与参数初始化](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12)
- [JLS 21 §12.7：类与接口卸载](https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html#jls-12.7)
- [Java 21 String API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html)
- [Java 21 List API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html)
- [Java 21 Arrays.asList API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Arrays.html#asList(T...))
- [Java 21 ArrayList API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ArrayList.html)
- [Java 21 HashSet API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashSet.html)
- [Java 21 HashMap API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html)
- [JEP 122：JDK 8 移除永久代](https://openjdk.org/jeps/122)
- [Oracle JDK 7：PermGen space 故障说明](https://docs.oracle.com/javase/7/docs/webnotes/tsg/TSG-VM/html/memleaks.html#gbyuu)（只用于旧版 HotSpot 的历史边界）
- [Oracle Java 21：Troubleshoot Memory Leaks](https://docs.oracle.com/en/java/javase/21/troubleshoot/troubleshooting-memory-leaks.html)
- [《Java 开发手册》：领域模型命名约定示例](https://alibaba.github.io/Alibaba-Java-Coding-Guidelines/)（工程约定示例，不作为语言规范）
- [Martin Fowler：Value Object](https://martinfowler.com/bliki/ValueObject.html)（建模概念，不是 View Object 的同义词）
