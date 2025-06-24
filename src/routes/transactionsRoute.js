import express from 'express';
import { getTransactionsByUserId , createTransaction, deleteTransaction, getReportByUserId} from '../controllers/transactionsController.js';
export const router = express.Router();


router.get('/report/:user_Id', getReportByUserId); // ✅ specific route first
router.get("/:user_Id", getTransactionsByUserId);  // ✅ generic route after
router.post('/', createTransaction);
router.delete('/:id', deleteTransaction);
export default router;