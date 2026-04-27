# 04 · 主题系统

## 一、主题范围

v1 支持 light、dark、system 三种主题。主题切换只改变 CSS 变量，不改变组件结构，不重新加载路由。

## 二、亮色主题

```css
:root[data-theme="light"] {
  --surface-paper: #F7F1E4;
  --surface-paper-muted: #EFE4D0;
  --text-ink: #1F2421;
  --text-ink-muted: #5F655F;
  --brand-cinnabar: #B64032;
  --brand-jade: #2F6F5E;
  --brand-celadon: #6F9F8D;
  --brand-porcelain: #DCE8E2;
  --brand-mist-blue: #AEBFCC;
  --brand-aged-gold: #A37A32;
  --glass-paper: rgba(247,241,228,.74);
  --glass-porcelain: rgba(220,232,226,.50);
  --line-hair: rgba(31,36,33,.16);
  --shadow-glass: 0 14px 36px rgba(45,39,29,.12);
}
```

## 三、暗色主题

```css
:root[data-theme="dark"] {
  --surface-paper: #171512;
  --surface-paper-muted: #211E19;
  --text-ink: #F4EFE4;
  --text-ink-muted: #BEB6A6;
  --brand-cinnabar: #E06B5C;
  --brand-jade: #6EA68F;
  --brand-celadon: #8DBBA8;
  --brand-porcelain: #253A35;
  --brand-mist-blue: #526879;
  --brand-aged-gold: #C6A15A;
  --glass-paper: rgba(33,30,25,.76);
  --glass-porcelain: rgba(37,58,53,.46);
  --line-hair: rgba(244,239,228,.14);
  --shadow-glass: 0 18px 42px rgba(0,0,0,.34);
}
```

## 四、状态优先级

1. 用户已登录偏好 `preferences.theme`
2. 本地存储 `zhiyu.theme`
3. 系统 `prefers-color-scheme`
4. 默认 light

切换主题时写本地存储；已登录时同步到用户偏好 API。

## 五、主题组件

- Profile 设置页：分段控件 light/dark/system。
- 后台 TopBar 用户菜单：同一控件。
- 所有图标按钮必须有 tooltip/aria-label。

## 六、主题动效

- 切换时长 180ms，仅 transition `background-color`, `color`, `border-color`, `box-shadow`。
- 不做全屏闪白/闪黑。
- `prefers-reduced-motion` 下关闭主题过渡。

## 七、暗色设计注意

- 暗色不是纯黑。使用夜墨暖黑，保留纸感。
- 朱砂暗色只做点睛，避免高饱和红字大面积出现。
- 阅读页暗色默认降低纹理强度，保护长文可读性。
- 后台暗色表格 hover 与 focus 必须清楚。

## 八、验收

- [ ] 全部组件在明/暗主题均满足 WCAG AA。
- [ ] 主题切换不导致布局抖动。
- [ ] Profile 与 Admin 两端偏好一致。
- [ ] 无旧彩色渐变主题变量残留。