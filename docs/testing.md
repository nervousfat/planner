# 验证指南

Node.js 22 或更新版本可运行全部验证，无需安装依赖。在仓库根目录执行 npm test；它使用 node --test 自动发现 core.test.js 与 tests/*.test.js。

~~~powershell
npm test
npm run check
node --test tests/backup-boundaries.test.js
node --test --experimental-test-coverage
~~~

tests/fixtures.mjs 提供确定的任务、版本化状态和递归冻结辅助函数。它不调用产品实现构造预期值，测试通过公开函数验证行为。时间相关测试显式传入参考日期，不依赖运行当天。

测试按行为组织：输入与时间验证、状态修改的原子性、排序和过滤规则、统计与分组、UTF-8 备份边界。修改一个行为时，可先运行相应文件定位失败，然后运行全部测试检查交互影响。不要仅以行覆盖率判断契约是否充分。

npm run check 检查产品脚本语法。领域测试不会打开浏览器，也不证明 localStorage、文件选择、布局或用户确认操作正常。发布前仍需在浏览器确认新建/编辑/导出/导入流程和窄屏页面。

测试文件应使用 .test.js 后缀并放在 tests 目录；夹具与辅助模块使用 .mjs，避免被当成独立测试。每个回归测试描述用户可观察的规则或被修复的问题，使用固定输入和独立断言。
