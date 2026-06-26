# 搜索与过滤

queryTasks 组合以下条件，全部取交集：

- search：对标题、备注与标签做大小写不敏感的子串匹配；
- priority / status：精确相等；
- due=overdue：截止日早于参考日且未完成的任务；
- due=today：截止日等于参考日且未完成的任务；
- due=none：未设置截止日的任务。

参考日期必须是 YYYY-MM-DD，否则抛出“参考日期不正确”。
