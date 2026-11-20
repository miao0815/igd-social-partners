# 两套 SC-IAT 线上版 1.0.0

依据 IGD_SCIAT_MATLAB2016_v3_1.zip 的实际代码迁移，不使用旧仓库的情境选择任务。主试入口 launcher.html；被试入口 index.html。GitHub只托管程序，不保存被试作答。

## 当前状态
程序和DataPipe上传接口已实现；config.js 暂未填写此次实验的 Experiment ID、问卷B链接和最终线上知情同意。collectionEnabled 默认false，正式/完整预测试不可开始；demo可试跑。旧仓库中的DataPipe ID不自动复用。补配置后还必须使用测试编号确认后台实际收到文件。

## 主试操作
1. 在自己的DataPipe账户新建或选定本研究实验，连接自己的数据存储目的地，开启数据接收。复制dashboard的Experiment ID（不是访问token、OSF token或账户密码）。
2. config.js：dataPipeExperimentId填该ID；questionnaireBUrl填任务后问卷B的HTTPS链接（不是报名预筛A）；contact填研究联系渠道；consentText填研究团队确认的线上版知情同意全文，需如实说明远程任务、数据传输和报酬；collectionEnabled在准备完毕后设true。
3. GitHub Pages发布包含本文件的目录。当前仓库采用独立online-sciat子目录；访问 /igd-social-pilot/online-sciat/launcher.html 生成链接。
4. 在各高/低组内分别分配条件1—8，不向被试展示组别。被试输入或核对1—8位匿名数字编号，保留前导0。不传真实姓名、电话、组别标签。
5. 先demo测试显示与按键，再以测试编号pilot完整运行，并在DataPipe目的地核对 *_complete.json 含384条trial、2个summary、正确编号及condition。验证网络失败重试后再招募。
6. 完成两套任务且上传回执成功后，引导问卷B；问卷B手动填相同编号。尚未自动回填问卷星编号。

## 模式与条件
- demo：128试次，8练习+24正式 × 2配对 × 2对象，只保存本机，不上传。
- pilot/formal：384试次，24练习+72正式 × 2配对 × 2对象。共96练习、288正式。流程一致，mode与文件名前缀不同。
- condition1—8：condition-1的最低位控制对象先后，第二位控制现实P/N先后，第三位控制游戏P/N先后。链接有condition时按链接；否则按数字编号 (id-1) mod8+1。自动编号取模本身不保证两组内平衡，请用launcher显式分配。
- 积极始终E，消极始终I；目标类别在P配对按E、N配对按I。P区块目标:积极:消极=1:1:2；N区块=1:2:1，与MATLAB源程序相同（未擅自换成其他SC-IAT比例）。每种词循环使用，目标词顺序每套任务随机，区块内洗牌。
- 注视250ms；刺激最长2000ms，首个E/I反应结束；练习反馈150ms（O/X/超时提示），正式对应150ms空白；再空白250ms。每段前有按键规则说明，空格继续，两套之间可休息。
- 随机数算法换为mulberry32，保存seed与完整schedule；同seed不保证与MATLAB产生相同词序，但计数和配对逻辑相同。

## 线上运行与计时边界
仅电脑实体键盘；手机/平板及小窗口拦截。pilot/formal要求全屏；ESC退出全屏会记录事件、在下一试次前暂停恢复，不沿用MATLAB的ESC立即退出。需要退出可关闭页面；已有本地/区块备份保留。刷新不自动续跑，先提示下载上次记录，避免把两次任务拼接。

通过requestAnimationFrame更新画面，以performance.now和键盘事件处理时间计算RT。记录浏览器、屏幕、视口、DPR、帧间隔、切屏/失焦/退出全屏。没有PTB的VBL同步检查，也不能声称浏览器具有PTB同等级显示时间戳；线上与线下测量条件已经改变。正式收集前由导师确认线上方案和知情同意；不要把旧线下数据与线上数据不加区分地混合。

被试切屏会标记当前试次interrupted；下一试次前提示恢复。原始记录不删除、不追加重做试次；事件和在线质量标志供研究者检查，未擅自制定新的排除阈值。浏览器计时不同于物理显示/键盘延迟的硬件校准。

## 数据保存
每个试次结束后写浏览器localStorage（响应窗口内不写盘/网络）。区块结束上传全量累计JSON（8份block快照），结束上传1份complete JSON。每次上传是DataPipe一次独立文件提交，因此一个完成会话通常9份文件；DataPipe配额/会话限制需按文件提交次数留足。不要把快照当作9名被试或重复合并试次。

文件名包含模式、编号、UUID和阶段，重跑不覆盖。JSON包含schedule、trials、summary、环境、事件和上传历史。最终文件里不可能包含自身保存后的回执，该回执保存在本地session；后台收到complete文件本身即为依据。

201表示已存储；202表示DataPipe已接收并排队转存，也视为已提交，不能重复发。网络失败显示重试和下载备份，不伪报成功；重试冻结payload及filename，若FILE_EXISTS则要求主试核对，不自动换名重复上传。非最终快照失败可选择保留本地继续；最终失败必须重试或下载后联系主试，不显示已提交页面。localStorage不等于服务器保存，清理浏览器数据会丢失本地备份；可从结束页下载JSON/逐试次CSV。

网页没有账户密钥。Experiment ID为公开写入标识，不是保密token。参与者数据只经HTTPS发至DataPipe，不能上传到公开GitHub仓库。保存目的地及访问权限在DataPipe账户管理。

## 分析（继承MATLAB实现，不声称另行验证）
score仅纳入正式试次，要求每对象144条（demo48）。RT350—2000ms且非timeout纳入；错误替换为本配对正确有效RT均值+400ms；分母为该对象两配对全部正确有效RT合并后的样本标准差；D=(N均值-P均值)/SD。错误率>20%或过快率>10%保留D_raw、D_usable置null。错误率含timeout。浏览器干扰另记online_review_required，不自动改变原始算法。各指标需按最终分析计划确认。

汇总：python analyze.py 下载目录 --out results （默认只取formal完整会话；pilot需 --mode pilot）。跳过block快照，按session_id去重，重复编号另行标记，不擅自删除。输出summary.csv、trials.csv，用participant_id对接两份问卷。

## 测试与依赖
node test_core.cjs 验证全部8条件×3模式、试次比例、按键映射、条件顺序和人工计分夹具。jsPsych 8.2.2 本地固定版本，运行时无需从CDN加载。浏览器实机显示和真实DataPipe目的地收件需上线后实测。

官方参考：
- https://www.jspsych.org/v8/developers/plugin-development/
- https://pipe.jspsych.org/docs/api
- https://pipe.jspsych.org/docs/experiments/sending-data
