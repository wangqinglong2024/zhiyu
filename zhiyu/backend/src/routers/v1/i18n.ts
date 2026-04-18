import { Router, Request, Response, NextFunction } from 'express'
import { success } from '../../core/response'
import { i18nService } from '../../services/i18n-service'

const router = Router()

// GET /api/v1/i18n/:lang — 获取指定语言的全部翻译
router.get('/:lang', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lang = req.params.lang as string
    if (!['zh', 'en', 'vi'].includes(lang)) {
      res.status(400).json({ code: 40001, message: '不支持的语言代码', data: null })
      return
    }
    const data = await i18nService.getTranslations(lang)
    res.set('Cache-Control', 'public, max-age=3600')
    success(res, data)
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/i18n/:lang/:namespace — 获取指定语言 + namespace 翻译
router.get('/:lang/:namespace', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lang, namespace } = req.params as { lang: string; namespace: string }
    if (!['zh', 'en', 'vi'].includes(lang)) {
      res.status(400).json({ code: 40001, message: '不支持的语言代码', data: null })
      return
    }
    const data = await i18nService.getTranslationsByNamespace(lang, namespace)
    res.set('Cache-Control', 'public, max-age=3600')
    success(res, data)
  } catch (err) {
    next(err)
  }
})

export default router
