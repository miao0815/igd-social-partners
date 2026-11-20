/* 只填写 DataPipe dashboard 的 Experiment ID，不填账户 token 或密码。 */
window.STUDY_CONFIG = Object.freeze({
  version: 'online-sciat-1.0.0',
  dataPipeExperimentId: '',
  questionnaireBUrl: '', // 问卷B链接，不是报名预筛问卷A
  contact: '请联系向您发送实验邀请的研究人员',
  collectionEnabled: false, // 配置ID、核对线上知情同意并完成上传试测后改为 true
  consentText: '' // 放入经研究团队确认的线上任务知情同意全文。未填写时正式入口关闭。
});
