Python 的类型注解让代码意图更清晰、IDE 补全更精准，而 Pydantic 则将注解从"文档说明"变成了真正的运行时数据契约。

## 类型注解基础

### 变量注解与函数注解

```python
name: str = "Alice"
age: int = 30
scores: list[float] = [9.5, 8.0]

def greet(user: str, repeat: int = 1) -> str:
    return user * repeat
```

注解本身不产生任何运行时效果，只是元数据，存储在 `__annotations__` 属性中。这是初学者最容易误解的一点：写了 `age: int` 并不会阻止你赋值字符串，Python 解释器不会做任何检查。注解的真正价值在于两类工具——静态类型检查器（mypy、pyright）在编译前发现类型错误，以及 IDE 据此提供精准的补全和跳转。如果想在运行时强制校验，就需要 Pydantic 这类库主动读取注解并执行验证。

```python
print(greet.__annotations__)
# {'user': <class 'str'>, 'repeat': <class 'int'>, 'return': <class 'str'>}
```

## typing 模块常用类型

Python 3.9 之前，内置容器类型（`list`、`dict`）不支持泛型下标，必须从 `typing` 导入大写版本。3.9+ 后两者均可用，但 `typing` 版本兼容更老的代码库。

| typing 类型 | 含义 | Python 3.9+ 替代 |
|---|---|---|
| `List[int]` | 整数列表 | `list[int]` |
| `Dict[str, Any]` | 字符串键字典 | `dict[str, Any]` |
| `Optional[str]` | `str` 或 `None` | `str \| None` |
| `Union[int, str]` | 整数或字符串 | `int \| str` |
| `Tuple[int, ...]` | 任意长度整数元组 | `tuple[int, ...]` |
| `Callable[[int], str]` | 接受 int 返回 str 的函数 | 同左 |

```python
from typing import Optional, Union, Callable, TypeVar

T = TypeVar("T")

def first_or_default(items: list[T], default: T) -> T:
    return items[0] if items else default

def transform(value: int, fn: Callable[[int], str]) -> str:
    return fn(value)
```

`TypeVar` 用于泛型函数，表示"类型变量"——调用时由传入参数推断出具体类型。

## Python 3.10+ 新语法

### X | Y 联合类型

```python
def parse_id(value: int | str) -> int:
    return int(value)

def get_user(uid: int | None = None) -> dict | None:
    ...
```

### match 语句（结构模式匹配）

```python
def handle_command(command: str | dict) -> str:
    match command:
        case str() as s:
            return f"文本命令: {s}"
        case {"action": action, "target": target}:
            return f"对 {target} 执行 {action}"
        case _:
            return "未知命令"
```

`match` 不只是 `switch`，它支持解构、类型检查、守卫条件，配合类型注解使代码意图极为清晰。

## Pydantic BaseModel

Pydantic 在初始化时真正校验数据，类型错误会立刻抛出 `ValidationError`，而不是沉默地接受。

```python
from pydantic import BaseModel

class User(BaseModel):
    id: int
    name: str
    email: str
    is_active: bool = True

user = User(id="42", name="Alice", email="alice@example.com")
print(user.id)        # 42（字符串被自动转为 int）
print(user.model_dump())  # {'id': 42, 'name': 'Alice', ...}
```

Pydantic 会尝试**类型强制转换**（coerce）：`"42"` 能转成 `int` 就转，转不了才报错。

### Field：细化字段约束

```python
from pydantic import BaseModel, Field

class Product(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    price: float = Field(gt=0, description="价格，单位元")
    tags: list[str] = Field(default_factory=list)
    sku: str = Field(alias="product_sku")  # 接受 JSON 中的 product_sku 键
```

`alias` 在处理外部 API 响应（snake_case 与 camelCase 互转）时很常用。

### validator 与 field_validator

Pydantic v2 推荐使用 `field_validator`（取代 v1 的 `@validator`）：

```python
from pydantic import BaseModel, field_validator, model_validator

class SignupForm(BaseModel):
    username: str
    password: str
    confirm_password: str

    @field_validator("username")
    @classmethod
    def username_must_be_alphanumeric(cls, v: str) -> str:
        if not v.isalnum():
            raise ValueError("用户名只能包含字母和数字")
        return v.lower()

    @model_validator(mode="after")
    def passwords_match(self) -> "SignupForm":
        if self.password != self.confirm_password:
            raise ValueError("两次密码不一致")
        return self
```

`field_validator` 验证单个字段，`model_validator(mode="after")` 在所有字段赋值完成后运行，适合跨字段校验。

## Pydantic 在 FastAPI 中的核心地位

FastAPI 大量依赖 Pydantic 完成三件事：

1. **请求体解析与验证**：路由函数的参数类型声明为 Pydantic 模型，FastAPI 自动从 JSON body 反序列化并校验。
2. **响应序列化**：`response_model` 参数声明返回模型，FastAPI 过滤掉多余字段并序列化输出。
3. **自动生成 OpenAPI 文档**：Pydantic 模型的字段约束直接映射为 JSON Schema，无需额外编写文档。

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    name: str
    price: float

@app.post("/items", response_model=Item)
async def create_item(item: Item) -> Item:
    return item
```

这短短几行代码，FastAPI 已完成：类型校验、错误响应（422）、Swagger UI 文档生成。

## 常见误区

### 误区一：注解等于运行时检查

这是最常见的错误认知。

```python
def add(a: int, b: int) -> int:
    return a + b

result = add("hello", " world")  # 不报错！返回 "hello world"
```

原生 Python 注解在运行时完全不做检查，只有 Pydantic、`beartype`、`typeguard` 等第三方库才会在运行时执行类型验证。

### 误区二：Optional[str] 不等于"可选参数"

```python
from typing import Optional

def find(name: Optional[str]) -> ...:  # 表示值可以是 str 或 None
    ...

# 这个函数 name 参数是必传的，只是值允许为 None
find()        # TypeError: 缺少参数
find(None)    # 合法
```

`Optional[str]` 只是 `str | None` 的别名，与参数有无默认值无关。

### 误区三：Pydantic v1 与 v2 API 差异

| 功能 | v1 | v2 |
|---|---|---|
| 序列化 | `.dict()` | `.model_dump()` |
| 验证器 | `@validator` | `@field_validator` |
| JSON 解析 | `.parse_raw()` | `.model_validate_json()` |
| 配置类 | `class Config` | `model_config = ConfigDict(...)` |

升级时务必检查这些 API 变更，混用会导致静默行为差异。

## 面试要点

- **`TypeVar` 的作用**：定义泛型约束，让函数的输入输出类型保持一致，而不是退化为 `Any`。
- **`Protocol` vs `ABC`**：`Protocol` 实现结构化子类型（duck typing 的静态版本），无需显式继承；`ABC` 需要显式注册。
- **Pydantic 的性能**：v2 核心用 Rust 重写（pydantic-core），验证性能比 v1 快 5-50 倍。
- **`model_config = ConfigDict(strict=True)`**：开启严格模式后，Pydantic 不再做类型强制转换，`"42"` 传给 `int` 字段会直接报错，适合对数据质量要求极高的场景。
- **`Annotated` 类型**：Python 3.9+ 引入，允许在类型中附加元数据，Pydantic 和 FastAPI 都用它来传递验证规则：`Annotated[int, Field(gt=0)]`。
