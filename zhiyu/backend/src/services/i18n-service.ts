import { i18nRepo } from '../repositories/i18n-repo'
import { AppException } from '../core/exceptions'
import type { CreateTranslation, UpdateTranslation, BatchImport, I18nQuery } from '../models/i18n'

/**
 * i18n 业务服务层
 */
export class I18nService {
  /**
   * 获取指定语言的全部翻译（按 namespace 分组）
   */
  async getTranslations(lang: string) {
    return i18nRepo.findByLang(lang)
  }

  /**
   * 获取指定语言 + namespace 翻译
   */
  async getTranslationsByNamespace(lang: string, namespace: string) {
    return i18nRepo.findByLangAndNamespace(lang, namespace)
  }

  /**
   * 管理后台 — 翻译列表
   */
  async listTranslations(query: I18nQuery) {
    return i18nRepo.findAll({
      page: query.page,
      pageSize: query.page_size,
      keyword: query.keyword,
      namespace: query.namespace,
      language: query.language,
    })
  }

  /**
   * 新增翻译
   */
  async createTranslation(input: CreateTranslation) {
    try {
      return await i18nRepo.create(input)
    } catch (err) {
      if (err instanceof Error && err.message === 'DUPLICATE') {
        throw new AppException(409, 40901, '该翻译条目已存在')
      }
      throw err
    }
  }

  /**
   * 更新翻译
   */
  async updateTranslation(id: string, input: UpdateTranslation) {
    return i18nRepo.update(id, input as Record<string, unknown>)
  }

  /**
   * 删除翻译
   */
  async deleteTranslation(id: string) {
    return i18nRepo.delete(id)
  }

  /**
   * 批量导入（upsert）
   */
  async batchImport(input: BatchImport) {
    const result = await i18nRepo.batchUpsert(input.translations)
    return { imported: result?.length || 0 }
  }
}

export const i18nService = new I18nService()
