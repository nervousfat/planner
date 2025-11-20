# 领域函数契约

core.js 与浏览器 DOM、localStorage 无关，可在 Node.js 中直接导入。应用状态为 version: 1 与 tasks 数组，所有写操作先验证完整状态，再返回新状态。

~~~js
import {createTask, updateTask, moveTask} from '../core.js';
const initial = {version: 1, tasks: []};
const created = createTask(initial, {title: '阅读'}, 'read', '2025-07-01T09:00:00Z');
const edited = updateTask(created, 'read', {priority: 'high'});
const completed = moveTask(edited, 'read', 'done');
~~~

上述调用不会改变 initial、created 或 edited。创建的 id 与 createdAt 以显式参数为准，不能被 fields 中同名值覆盖；编辑时这两个字段保留原值。无效字段、重复标识或找不到任务会抛出 Error，不返回半完成状态。

日期只接受真实存在的四位年份 YYYY-MM-DD。createdAt 单独要求 UTC 时间戳。业务日期按传入字符串比较，调用方应明确传入当地的参考日期，避免跨时区时把 UTC 日期当作今天。

normalizeTask 和 validateState 返回规范化副本，包括独立标签数组。queryTasks、sortTasks、groupByStatus 只处理已验证的任务，返回的任务对象不作深拷贝；不要把它们当作写入 API。

状态、优先级为固定枚举。字符上限按 JavaScript 字符串 length 计算，emoji 可能占两个字符单元。备份大小另按 UTF-8 字节计算，两者不能混用。
