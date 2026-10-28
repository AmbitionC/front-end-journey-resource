公司：百度；方向：测试开发；来源自述记录了一至三面，未明确面试年月日与部门。本文选录 SQL 聚合与 Skill 两组问题，省略未保留完整题面的编程题及个人经历。以下解答、表结构与例子均为编辑教学补充。

<details data-knowledge-key="sql-core">
<summary>（1）怎样按月份降序统计销售额，WHERE 与 HAVING 分别放什么条件？</summary>
</details>

先按年、月形成分组并对金额求和，再按年、月降序排列。WHERE 筛选参与聚合的原始行，HAVING 筛选聚合后的组；原题没有要求销售额阈值，就不必为了展示 HAVING 而添加过滤条件。只按月份数字分组会把不同年份的同月混在一起。

下面明确采用 MySQL 8.4，假设教学表为 sales(sold_at, amount)，日期已按同一业务时区解释，金额已是可直接相加的销售额；这些字段和口径不是原帖给出的。

```sql
SELECT EXTRACT(YEAR FROM sold_at) AS sales_year,
       EXTRACT(MONTH FROM sold_at) AS sales_month,
       SUM(amount) AS total_sales
FROM sales
GROUP BY EXTRACT(YEAR FROM sold_at), EXTRACT(MONTH FROM sold_at)
ORDER BY sales_year DESC, sales_month DESC;
```

例如两笔记录分别属于不同年份的一月，就应输出两个组。若要限制原始订单状态，条件放 WHERE；若另有“每月总额超过某值”的要求，才使用 HAVING SUM(amount) > 指定值。[MySQL 8.4 的 SELECT 文档](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/select.html)区分行条件与组条件，[EXTRACT 文档](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/date-and-time-functions.html#function_extract)说明从日期提取组成部分。

这里给出的是未在数据库运行的教学 SQL。退款、空日期、无销售月份是否补零以及跨时区归月，都要由业务口径决定；不能把一个按月分组查询直接称为完整销售报表。

延伸阅读：[SQL 核心语法与进阶查询](../../../knowledge/data/sql/sql-core.md)。

<details data-knowledge-key="agent-skill-design">
<summary>（2）Skill 怎样组织可复用能力，实际使用时应说明哪些内容？</summary>
</details>

Skill 把一类任务的适用说明、操作步骤及可选脚本或资料组织成可发现的能力。可以先用名称和描述选择，再按需加载详细说明；它不会自动赋予工具权限。介绍实践时，应说清触发条件、输入、输出、失败处理与验证方式，不能把没做过的流程包装成自己的经验。

[Agent Skills 规范](https://agentskills.io/specification)以 SKILL.md 的元信息和正文说明能力，并允许附带脚本、参考资料等资源。渐进加载能减少一次塞入所有说明的负担，但具体怎样选择、加载和调用由宿主实现；不能据此声称所有平台都使用同一消息位置或缓存策略。

教学例子可以是一项“检查代码变更”的 Skill：输入是指定仓库与变更范围，步骤是读取项目约束、检查差异、运行适用验证，输出为有证据的问题与结果。脚本存在不代表可以执行任意命令，执行仍受调用者权限与环境边界约束；缺依赖或无法验证时应如实返回限制。

Skill 描述一项能力的使用方法，Agent 运行循环负责在任务中选择工具、接收结果并决定下一步，两者职责不同。原记录没有详细保留 Skill 追问，也没有给出可验证实现；面试回答应以真实使用经历为准，以上流程只是教学示例。

延伸阅读：[Agent Skill：渐进式披露、热插拔与版本治理](../../../knowledge/llm/agent/agent-skill-design.md)。

## 参考资料

- [MySQL 8.4：SELECT、WHERE 与 HAVING](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/select.html)。
- [MySQL 8.4：日期提取 EXTRACT](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/date-and-time-functions.html#function_extract)。
- [Agent Skills 规范](https://agentskills.io/specification)。
