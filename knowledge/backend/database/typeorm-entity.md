# TypeORM 实体设计与关联查询

TypeORM 是 TypeScript 生态中最成熟的 ORM 框架，通过装饰器将类映射到数据库表，同时提供强类型的查询 API。

## 基础实体定义

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  avatar: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

- `@Entity('users')` 指定表名；省略参数时默认使用类名的蛇形命名。
- `@PrimaryGeneratedColumn()` 自增主键；也可用 `@PrimaryGeneratedColumn('uuid')` 生成 UUID。
- `@CreateDateColumn` / `@UpdateDateColumn` 由 TypeORM 自动管理，无需手动赋值。

## 列类型与选项

```typescript
@Column({ type: 'enum', enum: ['admin', 'user', 'guest'], default: 'user' })
role: 'admin' | 'user' | 'guest';

@Column({ type: 'decimal', precision: 10, scale: 2 })
price: number;

@Column({ type: 'text', nullable: true })
description: string | null;

@Column({ type: 'json', nullable: true })
metadata: Record<string, unknown> | null;
```

## 关联关系

### 一对多 / 多对一

```typescript
// Post 属于一个 User（多对一）
@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  userId: number;
}

// User 有多个 Post（一对多）
@Entity('users')
export class User {
  // ... 其他列 ...

  @OneToMany(() => Post, (post) => post.user)
  posts: Post[];
}
```

`onDelete: 'CASCADE'` 表示删除用户时联级删除其文章；生产环境需谨慎评估。

### 多对多

```typescript
@Entity('articles')
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToMany(() => Tag, (tag) => tag.articles)
  @JoinTable({ name: 'article_tags' })  // 只在拥有方加 @JoinTable
  tags: Tag[];
}

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToMany(() => Article, (article) => article.tags)
  articles: Article[];
}
```

### 一对一

```typescript
@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;
}
```

## 关联查询

### QueryBuilder（推荐复杂查询）

```typescript
const posts = await dataSource
  .getRepository(Post)
  .createQueryBuilder('post')
  .leftJoinAndSelect('post.user', 'user')
  .leftJoinAndSelect('post.tags', 'tag')
  .where('post.userId = :userId', { userId: 1 })
  .andWhere('post.createdAt > :date', { date: new Date('2024-01-01') })
  .orderBy('post.createdAt', 'DESC')
  .skip(0)
  .take(10)
  .getMany();
```

### find + relations（简单查询）

```typescript
const user = await userRepository.findOne({
  where: { id: 1 },
  relations: ['posts', 'posts.tags'],
});
```

注意：`relations` 选项在深层嵌套时容易引发 N+1 问题（见下文）。

## N+1 问题与解决

N+1 是关联查询的经典陷阱：查询 N 条记录后，对每条记录再发出一次查询。

```typescript
// 错误示范：触发 N+1
const users = await userRepository.find(); // 1 次查询
for (const user of users) {
  const posts = await postRepository.find({ where: { userId: user.id } }); // N 次查询
}

// 正确做法：一次 JOIN 加载
const users = await userRepository.find({ relations: ['posts'] }); // 2 次查询（IN 优化）
// 或使用 QueryBuilder 明确 JOIN
```

TypeORM 的 `relations` 选项内部会将 N 次子查询优化为 `WHERE id IN (...)` 的方式，但对于非常大的数据集仍需注意性能。

## 迁移管理

```bash
# 根据实体变更生成迁移文件
npx typeorm migration:generate src/migrations/AddPostTable -d src/data-source.ts

# 执行迁移
npx typeorm migration:run -d src/data-source.ts

# 回滚上一次迁移
npx typeorm migration:revert -d src/data-source.ts
```

生产环境**不要**使用 `synchronize: true`，它会直接修改数据库结构，存在数据丢失风险；应通过迁移文件管理变更。

## 面试常问

- **`@JoinColumn` 和 `@JoinTable` 的区别？**
  `@JoinColumn` 用于一对一/多对一的外键声明（只在拥有方标注）；`@JoinTable` 用于多对多，声明中间表（只在拥有方标注）。
- **如何避免 N+1 问题？**
  用 QueryBuilder 显式 JOIN，或在 `find` 时通过 `relations` 让 TypeORM 批量查询，尽量不在循环里发查询。
- **`synchronize: true` 为何不能用于生产？**
  它会自动 ALTER TABLE，可能导致字段删除或数据丢失，应使用迁移文件进行可控变更。
- **软删除如何实现？**
  使用 `@DeleteDateColumn()` 配合 `softDelete()` / `restore()` 方法，TypeORM 会自动在查询中加 `WHERE deletedAt IS NULL`。
