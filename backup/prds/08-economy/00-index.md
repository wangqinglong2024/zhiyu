# 08 · 知语币与积分（Economy · EC）

> **代号**：EC | **优先级**：P0 | **核心**：知语币（Zhiyu Coin）虚拟货币，签到 / 任务 / 解锁皮肤 / 道具

## 文件
- [01-functional-requirements.md](./01-functional-requirements.md)
- [02-data-model-api.md](./02-data-model-api.md)
- [03-acceptance-criteria.md](./03-acceptance-criteria.md)

## 关键决策
- 名称：知语币（Zhiyu Coin / ZC）
- 兑换基准：1 USD = 100 ZC（仅指代价值锚定，禁止现金兑现）
- 月会员等价：1 月 = 400 ZC
- 注册赠：100
- 签到（每日）：1-10 不是随机，是越大的数字，概率越低。50%是1或2，30%是3或4，10%是5或6，8%是7或8，2%是9或10；
- 学习时长：日 30min → +10
- 完关 / 通关 / 完节：+5~30
- 用户报错被采纳：+5
- 推荐人来源新增有效推荐：+10
- 月发行上限：50,000 ZC / 用户 / 年（防爆发）
- 消耗（sinks）：streak freeze 50 / 张、道具 / 皮肤 / 头像框
- 不可现金兑回（合规）
