import { Router, Response, NextFunction } from 'express'
import { authMiddleware, AuthRequest } from '../../../core/auth'
import { success } from '../../../core/response'
import * as certificateService from '../../../services/certificate-service'

const router = Router()

router.use(authMiddleware)

// GET /certificates — 我的证书列表
router.get('/', async (req, res: Response, next: NextFunction) => {
  try {
    const { sub } = (req as unknown as AuthRequest).user
    const result = await certificateService.getUserCertificates(sub)
    success(res, result)
  } catch (err) {
    next(err)
  }
})

// GET /certificates/:certificateNo — 证书详情
router.get('/:certificateNo', async (req, res: Response, next: NextFunction) => {
  try {
    const { certificateNo } = req.params
    const result = await certificateService.getCertificateByNo(certificateNo)
    success(res, result)
  } catch (err) {
    next(err)
  }
})

export default router
