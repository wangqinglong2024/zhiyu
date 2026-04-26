# Self-hosted fonts (Zhiyu)

This folder receives **OFL / SIL-licensed** font files used by `@zhiyu/ui`.

The repo ships **no actual font binaries** — at runtime CSS gracefully falls
through to the operating-system stack (Inter / Segoe UI / PingFang / Noto / Tahoma).
Drop the listed files and re-run `vite build` for full self-hosting.

## Required files

| Family | File | Source |
| - | - | - |
| Inter VF | `inter/Inter-Variable.woff2` | https://github.com/rsms/inter (OFL) |
| Noto Sans SC | `notosc/NotoSansSC-{Regular,Medium,Bold}.woff2` | https://fonts.google.com/noto/specimen/Noto+Sans+SC (OFL) |
| Noto Sans Thai | `notothai/NotoSansThai-Regular.woff2` | OFL |
| Noto Sans Arabic | `notoarabic/NotoSansArabic-Variable.woff2` | OFL |
| JetBrains Mono | `jetbrains/JetBrainsMono-Regular.woff2` | OFL |

## Subsetting

For Noto SC, run `pnpm --filter @zhiyu/ui fonts:subset` (uses `glyphhanger` +
`fonttools` inside `zhiyu-app-fe` container; see `scripts/subset-fonts.mjs`).
Target budgets:

- Inter VF (latin + latin-ext) ≤ 80 KB gz
- Noto Sans SC (7000 most-used hanzi) ≤ 200 KB gz × 3 weights = ≤ 600 KB gz
- Noto Sans Thai ≤ 30 KB gz
- Noto Sans Arabic VF ≤ 60 KB gz
- JetBrains Mono regular ≤ 30 KB gz

## License

Drop license texts in `packages/ui/LICENSES/`:

- `LICENSES/Inter-OFL.txt`
- `LICENSES/NotoSansSC-OFL.txt`
- `LICENSES/NotoSansArabic-OFL.txt`
- `LICENSES/NotoSansThai-OFL.txt`
- `LICENSES/JetBrainsMono-OFL.txt`
