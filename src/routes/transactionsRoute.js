import express from 'express';
import { getTransactionsByUserId , createTransaction, deleteTransaction, getReportByUserId} from '../controllers/transactionsController.js';
export const router = express.Router();


router.get("/:user_Id", getTransactionsByUserId);
router.post('/', createTransaction);
router.delete('/:id', deleteTransaction);
router.get('/report/:user_Id', getReportByUserId);


export default router;