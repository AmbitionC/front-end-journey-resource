SQL 注入（SQL Injection）是 OWASP Top 10 常年榜首的漏洞类型，攻击者通过在用户输入中插入恶意 SQL 片段，操控数据库执行非预期的查询，轻则泄露数据，重则删库跑路。

## 攻击原理

**漏洞代码**（字符串拼接查询）：

```ts
// 危险！永远不要这样做
async function login(username: string, password: string) {
  const sql = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  return db.query(sql);
}
```

攻击者输入：
- `username = admin' --`
- `password = anything`

实际执行的 SQL：

```sql
SELECT * FROM users WHERE username = 'admin' -- ' AND password = 'anything'
```

`--` 是 SQL 注释符，密码校验被完全绕过，攻击者直接以 admin 身份登录。

更危险的变种：

```sql
-- 联合查询泄露其他表
' UNION SELECT username, password, null FROM admin_users --

-- 批量删除（破坏性攻击）
'; DROP TABLE users; --

-- 盲注（布尔型，逐字符探测）
' AND SUBSTRING(password,1,1)='a' --
```

## 防御方案

### 1. 参数化查询（首选，根本性防御）

参数化查询（Prepared Statements）将 SQL 逻辑与数据严格分离，数据库驱动保证用户输入永远被当作纯数据处理。

**原生 `mysql2`**：

```ts
import mysql from 'mysql2/promise';

const pool = mysql.createPool({ host: 'localhost', user: 'app', database: 'mydb' });

// 正确：使用占位符 ?
async function login(username: string, password: string) {
  const [rows] = await pool.execute(
    'SELECT id, username FROM users WHERE username = ? AND password_hash = ?',
    [username, password]
  );
  return (rows as any[])[0] ?? null;
}
```

**Prisma ORM**（TypeScript 生态主流选择）：

```ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Prisma 所有查询默认参数化，无 SQL 注入风险
async function getUserByUsername(username: string) {
  return prisma.user.findUnique({ where: { username } });
}
```

**TypeORM + QueryBuilder**：

```ts
const user = await dataSource
  .getRepository(User)
  .createQueryBuilder('user')
  .where('user.username = :username', { username }) // 命名参数，安全
  .getOne();
```

### 2. 输入验证与白名单

参数化查询保护值（Values），但**表名、列名、ORDER BY 方向**等动态 SQL 结构无法参数化，需用白名单校验：

```ts
const ALLOWED_SORT_COLUMNS = ['created_at', 'username', 'email'] as const;
type SortColumn = typeof ALLOWED_SORT_COLUMNS[number];

function buildOrderClause(column: string, direction: string): string {
  const safeColumn = ALLOWED_SORT_COLUMNS.includes(column as SortColumn)
    ? column
    : 'created_at'; // 默认回退
  const safeDirection = direction.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  return `ORDER BY ${safeColumn} ${safeDirection}`;
}
```

### 3. 最小权限原则

数据库账号只授予应用所需的最小权限：

```sql
-- 创建只读账号
CREATE USER 'app_readonly'@'%' IDENTIFIED BY 'strong_password';
GRANT SELECT ON mydb.* TO 'app_readonly'@'%';

-- 业务账号，禁止 DROP/ALTER
GRANT SELECT, INSERT, UPDATE, DELETE ON mydb.* TO 'app_user'@'%';
```

即使发生注入，`DROP TABLE`、`CREATE` 等破坏性操作也会因权限不足而失败。

### 4. 错误信息处理

```ts
// 危险：向客户端返回原始数据库错误
app.use((err: Error, _req: Request, res: Response) => {
  res.status(500).json({ error: err.message }); // 可能暴露表结构
});

// 安全：返回通用错误，详细日志只写服务端
app.use((err: Error, _req: Request, res: Response) => {
  logger.error('DB error:', err); // 服务端记录完整错误
  res.status(500).json({ error: 'Internal server error' }); // 客户端只见通用信息
});
```

## WAF 与检测

生产环境可以叠加 Web Application Firewall（WAF，如阿里云 WAF、Cloudflare WAF）作为额外防线，检测并拦截常见注入 Payload。但 WAF 是补充手段，不能替代参数化查询。

## 防御清单

| 防御层 | 措施 |
|---|---|
| 代码层 | 参数化查询 / ORM，禁止字符串拼接 SQL |
| 输入层 | 白名单校验动态表名/列名 |
| 数据库层 | 最小权限账号，禁止应用账号执行 DDL |
| 错误处理 | 不向客户端暴露数据库错误详情 |
| 网络层 | WAF 拦截已知注入特征 |
| 测试层 | 定期使用 sqlmap 等工具做渗透测试 |

## 面试常问

- **参数化查询为什么安全**：SQL 语句结构在编译阶段已固定，用户输入作为独立参数传递，数据库不会将其解析为 SQL 指令。
- **ORM 是否完全安全**：ORM 默认参数化，但若使用 `raw()` / `query()` 等原始查询并拼接用户输入，同样有注入风险。
- **存储过程能防注入吗**：只用固定参数的存储过程是安全的；若存储过程内部拼接动态 SQL，仍有风险。
- **前端过滤能防注入吗**：不能，攻击者可绕过前端直接发 HTTP 请求。防御必须在服务端。
