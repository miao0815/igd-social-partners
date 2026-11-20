# 验证记录 2026-11-19
- 已对照MATLAB v3.1的study_config、study_materials、make_sciat_schedule、run_sciat、score_sciat源文件。
- Node逻辑测试通过：24种模式/条件组合、类别数量、配对顺序、按键映射、随机种子重现、独立计分夹具。
- jsdom DOM集成测试通过：真实jsPsych核心+自定义插件完整跑完demo128、pilot384、formal384试次；编号001、condition8保持一致；所有自动按键正确记录；无JS错误。加速等待只用于测试，生产配置未加速。
- 模拟DataPipe：demo 0次上传；pilot/formal各9份不同文件名；最后包含全部384试次；201成功、202排队和400错误分支测试通过。
- 这些测试不是屏幕物理计时校准。未配置真实DataPipe ID，未执行真实目的地收件验证。
