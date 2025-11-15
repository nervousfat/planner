# 备份格式

备份是 UTF-8 JSON 对象，根字段为 version: 1 和 tasks 数组。空备份为：

~~~json
{"version":1,"tasks":[]}
~~~

每个任务包含 id、title、notes、status、priority、due、tags 和 createdAt。未知字段在验证后被剥离，导入不会保留自定义扩展字段。

| 字段 | 约束 |
| --- | --- |
| id | 非空字符串，最多 100 个 JavaScript 字符单元，同一备份内唯一 |
| title | 去掉首尾空白后 1–120 个字符单元 |
| notes | 字符串，最多 2000 个字符单元；省略时为空 |
| status | todo、doing 或 done |
| priority | high、medium 或 low |
| due | 空字符串或有效的 YYYY-MM-DD 日期 |
| tags | 最多 8 项，每项非空、最多 24 个字符单元；去掉首尾空白后按首次出现顺序去重 |
| createdAt | UTC 时间戳，秒或三位毫秒精度；输出统一为三位毫秒和 Z |

最多 500 个任务。导入和导出均限制为 2,000,000 个 UTF-8 字节，包含 JSON 标点、空白和缩进。中文与 emoji 的字节数通常大于字符串长度，因此任务数未到上限也可能达到文件上限。

importState 先解析、再验证整个对象；错误不会返回部分任务。exportState 会重新验证并格式化为两空格缩进。备份往返会规范化字段，不保证原始 JSON 文本的空白布局保持不变。
