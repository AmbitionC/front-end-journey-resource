# 密码加密与存储最佳实践

密码存储是应用安全的第一道防线。数据库一旦泄露，错误的存储方式会导致用户密码被批量破解；正确的方式则让攻击者无从下手。

## 为什么不能用 MD5 / SHA-1 存密码

MD5、SHA-1、SHA-256 是通用哈希算法，设计目标是**快速**。这恰恰是密码存储的致命缺陷：

- **彩虹表攻击**：攻击者预先计算海量常见密码的哈希值，查表即可反查原文。
- **暴力破解速度极快**：现代 GPU 每秒可计算数十亿次 MD5，简单密码分分钟破解。

即便加盐（salt），MD5/SHA 系列仍不适合密码存储，因为它们天生追求速度。

## 正确方案：慢哈希算法

专为密码设计的算法会**人为增加计算成本**，让暴力破解在时间上不可行。

### bcrypt（最常用）

bcrypt 内置 salt，通过 `cost factor`（工作因子）控制计算时间，工作因子每加 1，时间翻倍。

```ts
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12; // 建议 10-14，视服务器性能调整

// 注册时哈希密码
export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

// 登录时验证
export async function verifyPassword(
  plaintext: string,
  hashed: string
): Promise<boolean> {
  return bcrypt.compare(plaintext, hashed);
}
```

存储结果示例（60 字符）：

```
$2b$12$LKHd3.RcKA.eNy9MRb2sVeZFd9PaVV4DX4W.QkgWbKBFElXZBU9m2
```

其中 `$2b$` 是版本，`12` 是工作因子，后续包含 salt + hash，无需单独存 salt。

### Argon2（现代推荐）

Argon2 是密码哈希大赛（PHC）冠军，支持三种变体（Argon2id 最推荐），可配置时间、内存、并行度，抗 GPU/ASIC 破解能力更强。

```ts
import argon2 from 'argon2';

export async function hashPassword(plaintext: string): Promise<string> {
  return argon2.hash(plaintext, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,       // 迭代次数
    parallelism: 4,
  });
}

export async function verifyPassword(
  hashed: string,
  plaintext: string
): Promise<boolean> {
  return argon2.verify(hashed, plaintext);
}
```

### 算法对比

| 算法 | 内存硬度 | 推荐度 | 备注 |
|---|---|---|---|
| MD5 / SHA-1 | 无 | 禁止用于密码 | 速度太快，已大量彩虹表 |
| bcrypt | 低 | 广泛使用，稳妥 | 最长 72 字节，长密码需注意 |
| scrypt | 有 | 较好 | Node 内置 `crypto.scrypt` |
| Argon2id | 高 | 新项目首选 | PHC 推荐，抗 GPU 最强 |

## 完整登录存储流程

```ts
// 注册接口
async function register(username: string, password: string) {
  // 1. 基础校验（长度、复杂度）
  if (password.length < 8) throw new Error('密码至少 8 位');

  // 2. 哈希（bcrypt 自带 salt，无需手动生成）
  const hashedPassword = await hashPassword(password);

  // 3. 存库（只存 hashedPassword，永不存明文）
  await db.user.create({ data: { username, password: hashedPassword } });
}

// 登录接口
async function login(username: string, password: string) {
  const user = await db.user.findUnique({ where: { username } });

  // 防止用户枚举：无论用户是否存在，都执行一次哈希比对（耗时相近）
  const dummyHash = '$2b$12$LKHd3.RcKA.eNy9MRb2sVeZFd9PaVV4DX4W.QkgWbKBFElXZBU9m2';
  const isValid = user
    ? await verifyPassword(password, user.password)
    : await bcrypt.compare(password, dummyHash); // 避免时序攻击

  if (!user || !isValid) throw new Error('用户名或密码错误');

  return user;
}
```

## 其他安全实践

**密码强度校验**：
- 最小长度 8-12 位
- 建议混合大小写、数字、特殊字符
- 可接入 `zxcvbn` 库评估密码强度

**防暴力破解**：
- 登录失败 N 次后锁定账号或引入 CAPTCHA
- 配合限流（rate limiting）防止密码喷洒攻击
- 记录异常登录日志，接入报警

**传输安全**：
- 密码只在 HTTPS 信道传输，永不在 HTTP 明文传输
- 前端不做密码哈希（前端哈希后的值就成了新的密码，本质未提升安全性）

**泄露检测**：
- 注册/修改密码时，可调用 [HaveIBeenPwned API](https://haveibeenpwned.com/API/v3) 检查密码是否已在已知泄露库中（以官方文档为准）

## 面试常问

- **bcrypt 的 salt 存哪里**：bcrypt 的 salt 直接嵌入在哈希结果字符串中，无需单独存储，`compare` 时会自动提取。
- **为什么不直接 SHA-256 加 salt**：salt 解决了彩虹表，但 SHA-256 太快，GPU 暴力破解仍可行；bcrypt/Argon2 的慢哈希特性才是关键。
- **登录时如何防止用户枚举**：无论用户存不存在，都执行等时的哈希比对操作，返回统一的错误信息"用户名或密码错误"。
- **bcrypt 的 72 字节限制**：bcrypt 只处理密码的前 72 字节，超长密码会被截断。可在 bcrypt 前先做一次 SHA-256 再传入（以库的具体实现为准）。
