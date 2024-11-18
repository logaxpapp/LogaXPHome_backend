// src/routes/settingRoutes.ts

import express from 'express';
import {
  getAllSettingsHandler,
  updateSettingHandler,
  deleteSettingHandler,
  getSettingHistoryHandler,
  revertSettingHandler,
} from '../controllers/settingController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/authorizeRoles';

const router = express.Router();

router.use(authenticateJWT);

router.get('/', getAllSettingsHandler);
router.put('/', updateSettingHandler);
router.delete('/:key', deleteSettingHandler);
router.get('/:key/history', getSettingHistoryHandler);
router.post('/:key/revert', revertSettingHandler);

export default router;
