# 03 · 松烟雅瓷材质系统

## 一、定位

本项目保留毛玻璃，但它必须像“瓷釉、薄雾、宣纸上的透光层”，不是普通白色透明卡片。材质系统由纸、墨、瓷、雾、印五类构成。

## 二、材质层级

| 层级 | 类名 | 背景 | Blur | 用途 |
|---|---|---|---:|---|
| L0 | `.surface-paper` | 宣纸/夜墨实底 | 0 | 页面底、阅读区 |
| L1 | `.surface-wash` | 极淡水墨雾带 | 0 | 大背景氛围 |
| L2 | `.glass-porcelain` | 半透明瓷釉 | 10-14 | 卡片、TabBar、Header |
| L3 | `.glass-ink` | 深浅墨色半透明 | 12-18 | Cover 上按钮、HUD |
| L4 | `.glass-elevated` | 高亮瓷釉 + 阴影 | 18-22 | Modal、BottomSheet |
| L5 | `.seal-accent` | 朱砂实色/描边 | 0 | 主 CTA、小徽章、危险状态 |

同屏可见 backdrop blur 元素不超过 8 个；阅读/表格密集页不超过 4 个。

## 三、CSS 参考

```css
.surface-paper {
  background: var(--surface-paper);
  color: var(--text-ink);
}

.surface-wash {
  background:
    radial-gradient(ellipse at 18% 8%, rgba(111,159,141,.18), transparent 34%),
    radial-gradient(ellipse at 82% 18%, rgba(174,191,204,.16), transparent 32%),
    linear-gradient(180deg, var(--surface-paper), var(--surface-paper-muted));
}

.glass-porcelain {
  background: var(--glass-paper);
  backdrop-filter: blur(14px) saturate(118%);
  border: 1px solid var(--line-hair);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.42), var(--shadow-glass);
}

.glass-ink {
  background: rgba(31,36,33,.36);
  backdrop-filter: blur(16px) saturate(110%);
  border: 1px solid rgba(244,239,228,.18);
  color: #F4EFE4;
}

.seal-accent {
  background: var(--brand-cinnabar);
  color: #FFF8EC;
  box-shadow: 0 8px 20px rgba(182,64,50,.22);
}
```

## 四、纹理规则

- 宣纸颗粒：使用 1-2KB 内联 CSS noise 或本地 tiny PNG，opacity 2-4%。
- 水墨雾带：使用 CSS radial/linear gradient，不使用彩色 blob、粒子背景。
- 窗棂线：仅做 1px 分隔或封面遮罩，不做大面积图案。
- 印章：只作为状态/类目/成就的小面积视觉锚点。

## 五、使用场景

| 场景 | 推荐层级 |
|---|---|
| App Header / TabBar | L2 |
| Discover 类目卡 | L2 + 类目纹样 |
| 阅读页正文 | L0，避免玻璃包正文 |
| 文章 Cover 操作按钮 | L3 |
| 登录/注册 Modal | L4 |
| 游戏 HUD | L3，高对比优先 |
| 后台表格容器 | L0/L2，少 blur |

## 六、降级

- `prefers-reduced-transparency` 或低端设备：blur 降为 0，改为半透明实底。
- Safari/Android 性能不足：Header/TabBar 保留透明，列表卡片改实底。
- 打印、导出、截图卡：全部转实底，确保文本清楚。

## 七、验收

- [ ] 玻璃不会降低正文、拼音、翻译、表格文字对比度。
- [ ] 同屏 blur 数量符合预算。
- [ ] 低端设备降级后布局不跳动。
- [ ] 页面仍能体现宣纸、墨、瓷、印的识别度。