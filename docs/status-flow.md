# 状态流转

任务固定使用三个状态：todo、doing、done。

nextStatus 在相邻状态之间单步移动：

| 当前 | 前进 | 后退 |
|---|---|---|
| todo | doing | todo |
| doing | done | todo |
| done | done | doing |

到达两端时不再越界；方向只接受 1 与 -1，其余取值直接抛出错误。
