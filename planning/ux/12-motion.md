# 12 · 动效与微交互（Motion）

## 一、动效原则

1. **有目的**：动效服务于反馈、导航、状态变化，不为炫技
2. **轻盈**：毛玻璃 + 柔和缓动，不喧宾夺主
3. **快速**：默认 ≤ 300ms，避免阻塞操作
4. **一致**：相同操作相同动效
5. **可关闭**：尊重 `prefers-reduced-motion`

## 二、时长表

| 用途 | 时长 |
|---|---|
| 微交互（按钮按下） | 80-100ms |
| 状态变化（toggle） | 150-200ms |
| 页面元素进入 | 200-300ms |
| Modal 出现 | 250-300ms |
| 路由切换 | 300ms |
| 复杂场景（庆祝） | 400-800ms |

## 三、缓动表

| 名称 | cubic-bezier | 用途 |
|---|---|---|
| `linear` | 0,0,1,1 | 进度条 |
| `ease` | .25,.1,.25,1 | 默认 |
| `ease-out` | 0,0,.2,1 | 进入（推荐） |
| `ease-in` | .4,0,1,1 | 退出 |
| `ease-in-out` | .4,0,.2,1 | 双向 |
| `spring` | spring(1,80,10,0) | 弹性（FM） |
| `bounce` | 自定义 | 强调 |

CSS 变量：
```css
:root {
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --d-fast: 100ms;
  --d-base: 200ms;
  --d-slow: 300ms;
}
```

## 四、库选型

- **Framer Motion** v11+：组件级动效（Modal / 列表 / 路由）
- **Tailwind CSS animate**：简单状态过渡
- **Auto-Animate**：列表自动布局动画
- **Lottie**：复杂场景（庆祝 / 加载 / 引导）
- **PixiJS**：游戏动效

## 五、组件动效规范

### 5.1 Button
- hover：bg 200ms / scale 1.02 (桌面)
- active：scale 0.96 100ms
- 涟漪：从点击点扩散 400ms ease-out

### 5.2 Card
- hover (interactive)：translateY(-2px) + shadow + 200ms
- active：scale 0.98 100ms

### 5.3 Modal
- 出现：opacity 0→1 + scale 0.95→1 + 250ms ease-out
- 关闭：opacity 1→0 + scale 1→0.95 + 200ms ease-in
- 遮罩：opacity 0→1 + 250ms

### 5.4 BottomSheet
- 出现：translateY(100%)→0 + spring (damping 30, stiffness 300)
- 关闭：translateY(0)→100% + 200ms ease-in
- 拖拽：实时跟手

### 5.5 Toast
- 进入：translateY(-100%)→0 + opacity 0→1 + 300ms ease-out
- 退出：opacity 1→0 + scale 0.95 + 200ms ease-in

### 5.6 Tab 切换
- Indicator：spring (damping 25, stiffness 400)
- 内容：横向滑动 200ms ease-out

### 5.7 List 加入 / 移除
- 加入：opacity 0→1 + height 0→auto + 250ms
- 移除：opacity 1→0 + height auto→0 + 200ms
- 排序：FLIP 自动 250ms

### 5.8 Skeleton
- shimmer：1.5s infinite linear
- 内容替换：opacity fade 200ms

## 六、路由切换

### 6.1 默认
- 新页面：opacity 0→1 + 200ms

### 6.2 详情进入（push）
- 新页面：translateX(100%)→0 + 300ms ease-out
- 老页面：translateX(0)→-30% + 300ms ease-out + opacity 1→0.5

### 6.3 返回（pop）
- 反向

### 6.4 Tab 切换
- 横向滑动 200ms（左右方向按位置）

### 6.5 模态路由
- scale 0.95→1 + opacity 0→1 + 250ms

## 七、特殊场景动效

### 7.1 完成阶段庆祝
```
1. 烟花粒子（Lottie，2s）
2. 文字 "完成第3阶段！" 弹入 (spring, 400ms)
3. 知语币图标飞入 + 数字滚动 (600ms)
4. 三星评级逐颗点亮（间隔 300ms）
5. 按钮 fade in 800ms 后
```

### 7.2 答对反馈
- 卡片绿色边框 200ms + 缩放 1.02 + 触觉 success
- ✓ 图标 scale-in 300ms

### 7.3 答错反馈
- 卡片红色边框 + shake 300ms (translateX ±8px ×3)
- 触觉 error

### 7.4 加分动效
- 数字从底部弹入 + scale 0.5→1 + spring
- 旧分数 → 新分数 滚动 800ms

### 7.5 解锁动效
- 锁图标摇晃 → 散开 → 内容 fade in (1s)

### 7.6 知语币飞入
- 从原位置贝塞尔曲线飞向账户图标 + 旋转 + 600ms

## 八、Hero / 强视觉动效

### 8.1 启动屏
- Logo 呼吸 scale 1→1.05→1 + 2s loop
- MeshGradient 缓慢漂移 20s loop

### 8.2 Empty State
- 插画 浮动 ±4px + 3s loop

### 8.3 Loading
- Spinner：360° 旋转 1s loop
- 进度：filling 平滑

### 8.4 头像 / 等级升级
- 等级条填充 1s + 升级时缩放 + 粒子

## 九、滚动联动

### 9.1 Header 透明度
- scrollY 0-100：bg 0→full
- scrollY > 100：阴影增加

### 9.2 Cover 视差
- scroll 时 Cover 移动 0.5x 速度
- scale 1→1.1 (缩放视差)

### 9.3 元素入场
- IntersectionObserver 触发
- 距离视口 80px 时：opacity 0→1 + translateY 20→0 + 400ms

### 9.4 浮动 CTA
- scrollY > 200：底部 CTA 显示
- scrollY < 200：CTA 隐藏

## 十、Game 内动效（PixiJS）

### 10.1 通用
- Sprite 进出场 tween
- 粒子系统（爆炸、烟花）
- 物理（Matter.js）

### 10.2 关键动效
- 物体飞入飞出（贝塞尔）
- 击中爆炸（粒子 + 缩放消失）
- 倒计时数字 scale + opacity
- 通关庆祝（粒子 + 文字）
- 失败震屏（camera shake 300ms）

## 十一、prefers-reduced-motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```
- 视差关闭
- 自动播放停止
- 仅保留必要的状态过渡（fade）

## 十二、性能预算

- 60fps（中端机）
- 单页同时动画 ≤ 5
- transform / opacity 优先（GPU 加速）
- 避免 layout / paint 触发动画
- 大列表用 will-change（仅必要）

## 十三、检查清单

- [ ] 所有按钮含 hover / active 反馈
- [ ] 所有 Modal / Toast 进出场动效
- [ ] 路由切换流畅
- [ ] 庆祝场景含烟花 + 触觉
- [ ] 减弱动效模式可用
- [ ] iPhone 11 / 红米 Note 11 上 60fps
- [ ] 滚动入场动画不阻塞
