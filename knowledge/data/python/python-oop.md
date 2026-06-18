# Python 数据类型与面向对象

Python 的类型系统和面向对象特性是语言的核心，理解它们的底层机制能帮助你写出更清晰、更健壮的代码。

## 内置数据类型概览

Python 中"一切皆对象"，连整数、函数、类本身都是对象，都有类型和属性。内置类型大致分为标量类型和容器类型两大类，理解它们的可变性、有序性和底层存储方式，是写出正确代码的前提。

**标量类型**

| 类型 | 示例 | 说明 |
|------|------|------|
| `int` | `42`, `-7` | 任意精度整数 |
| `float` | `3.14` | 64 位浮点数 |
| `str` | `"hello"` | Unicode 字符串 |
| `bool` | `True`, `False` | `int` 的子类，`True == 1` |
| `None` | `None` | 单例对象，表示空值 |

**容器类型**

| 类型 | 有序 | 可变 | 允许重复 |
|------|------|------|----------|
| `list` | 是 | 是 | 是 |
| `tuple` | 是 | 否 | 是 |
| `dict` | 是（3.7+） | 是 | 键唯一 |
| `set` | 否 | 是 | 否 |

## 可变与不可变类型

**不可变类型**：`int`、`float`、`str`、`tuple`、`frozenset`  
**可变类型**：`list`、`dict`、`set`

```python
# 不可变：重新赋值创建新对象
a = "hello"
b = a
a += " world"
print(b)  # "hello"，b 未受影响

# 可变：共享同一对象引用
x = [1, 2, 3]
y = x
x.append(4)
print(y)  # [1, 2, 3, 4]，y 也被修改了
```

可变与不可变的区别直接影响函数传参的行为：Python 采用"传对象引用"的方式，函数内对不可变对象的"修改"实际生成新对象、不影响外部，而对可变对象（如 list）的原地修改会反映到调用方。这也是为什么把可变对象作为默认参数会埋下隐患（见下文）。此外，不可变类型才能作为字典的键或集合的元素，因为它们的哈希值在生命周期内保持不变。

**面试要点**：`id()` 返回对象的内存地址。小整数（-5 到 256）和短字符串会被 Python 缓存复用，所以 `a = 256; b = 256; a is b` 为 `True`，但 `a = 257; b = 257; a is b` 不保证为 `True`。

## 类的定义

### `__init__`、实例属性与类属性

```python
class Dog:
    # 类属性：所有实例共享
    species = "Canis lupus familiaris"

    def __init__(self, name: str, age: int):
        # 实例属性：每个实例独有
        self.name = name
        self.age = age

    def bark(self) -> str:
        return f"{self.name} says woof!"

dog1 = Dog("Rex", 3)
dog2 = Dog("Buddy", 5)

print(Dog.species)    # 通过类访问
print(dog1.species)   # 也可通过实例访问（查找链：实例 -> 类）
```

**常见陷阱**：通过实例修改类属性时，实际上是在实例上创建了一个同名的实例属性，不会影响其他实例。

```python
dog1.species = "modified"
print(dog2.species)  # 仍是原值，Dog.species 未改变
```

## 继承与多继承、MRO

```python
class Animal:
    def speak(self):
        return "..."

class Cat(Animal):
    def speak(self):
        return "Meow"

class Robot:
    def speak(self):
        return "Beep"

class RoboCat(Cat, Robot):
    pass

rc = RoboCat()
print(rc.speak())  # "Meow"
```

Python 使用 **C3 线性化算法**（MRO，Method Resolution Order）决定多继承时的方法查找顺序：

```python
print(RoboCat.__mro__)
# (<class 'RoboCat'>, <class 'Cat'>, <class 'Animal'>, <class 'Robot'>, <class 'object'>)
```

规则是深度优先，但保证每个类只出现一次，且子类总在父类之前。调用 `super()` 时遵循 MRO 顺序，而非简单地调用"父类"。

## 魔术方法（Dunder Methods）

魔术方法（以双下划线包裹，又称 dunder method）是 Python 实现"协议"的方式：你不需要继承某个接口，只要实现约定好的方法，对象就能被内置语法和函数识别。比如实现 `__len__` 就能用 `len()`，实现 `__iter__` 就能用 `for` 遍历，实现 `__add__` 就能用 `+` 运算。这种"鸭子类型"的设计让自定义类型与内置类型在使用上无缝统一。

```python
class Vector:
    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y

    def __repr__(self) -> str:
        # 面向开发者，用于调试，应可用于重建对象
        return f"Vector({self.x}, {self.y})"

    def __str__(self) -> str:
        # 面向用户，print() 时调用
        return f"({self.x}, {self.y})"

    def __eq__(self, other) -> bool:
        if not isinstance(other, Vector):
            return NotImplemented
        return self.x == other.x and self.y == other.y

    def __len__(self) -> int:
        # len() 要求返回非负整数
        return int((self.x**2 + self.y**2) ** 0.5)

    def __add__(self, other: "Vector") -> "Vector":
        return Vector(self.x + other.x, self.y + other.y)

v1 = Vector(3, 4)
v2 = Vector(1, 2)
print(v1)          # (3, 4)
print(repr(v1))    # Vector(3, 4)
print(len(v1))     # 5
print(v1 + v2)     # (4, 6)
```

**`__repr__` vs `__str__`**：若只定义 `__repr__`，`str()` 也会回退使用它；反之不成立。在容器（如列表）中显示对象时，始终调用 `__repr__`。

## dataclass 简化数据类

Python 3.7+ 的 `@dataclass` 自动生成 `__init__`、`__repr__`、`__eq__` 等方法：

```python
from dataclasses import dataclass, field

@dataclass
class Point:
    x: float
    y: float
    z: float = 0.0  # 带默认值的字段
    tags: list = field(default_factory=list)  # 可变默认值必须用 field

p1 = Point(1.0, 2.0)
p2 = Point(1.0, 2.0)
print(p1 == p2)   # True，自动生成 __eq__
print(repr(p1))   # Point(x=1.0, y=2.0, z=0.0, tags=[])
```

`@dataclass(frozen=True)` 使实例不可变（类似具名元组），同时自动生成 `__hash__`，可用于字典键和集合元素。

## 常见误区与面试要点

### 可变默认参数陷阱

```python
# 错误写法：默认列表在所有调用间共享
def append_to(item, lst=[]):
    lst.append(item)
    return lst

print(append_to(1))  # [1]
print(append_to(2))  # [1, 2]，而非 [2]！

# 正确写法
def append_to(item, lst=None):
    if lst is None:
        lst = []
    lst.append(item)
    return lst
```

### `is` vs `==`

- `==` 调用 `__eq__`，比较**值是否相等**
- `is` 比较**对象身份**（内存地址），等价于 `id(a) == id(b)`

```python
a = [1, 2, 3]
b = [1, 2, 3]
print(a == b)   # True，值相同
print(a is b)   # False，不同对象

# None 判断必须用 is，因为 None 是单例
if value is None:
    ...
```

### `__slots__` 优化内存

默认情况下，每个实例有一个 `__dict__` 字典存储属性。大量实例时可用 `__slots__` 节省内存：

```python
class Point:
    __slots__ = ("x", "y")

    def __init__(self, x, y):
        self.x = x
        self.y = y
# 使用 __slots__ 后，实例无法动态添加新属性，也没有 __dict__
```

### 面试高频考点

1. **`type()` vs `isinstance()`**：`type(x) == int` 不接受子类，`isinstance(x, int)` 更通用，优先使用后者。
2. **`__new__` vs `__init__`**：`__new__` 创建并返回实例，`__init__` 初始化已创建的实例。单例模式通常在 `__new__` 中实现。
3. **描述符协议**：`property`、`classmethod`、`staticmethod` 本质上都是描述符，实现了 `__get__`/`__set__`/`__delete__`。
4. **`@classmethod` vs `@staticmethod`**：前者接收类作为第一个参数（常用于工厂方法），后者不接收类或实例（普通工具函数）。
