import { sql } from "../config/db.js";

export async function getTransactionsByUserId(req, res) {
  try {
    const { userId } = req.params; // ensure this matches your router
    const { type } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    const baseQuery = sql`
      SELECT id, user_id, transaction_title, transaction_amount, transaction_category,
             transaction_type, related_user, created_at
      FROM transactions
      WHERE user_id = ${userId}
      ${type ? sql`AND transaction_type = ${type}` : sql``}
      ORDER BY created_at DESC
    `;

    const transactions = await baseQuery;
    res.status(200).json(transactions);
  } catch (error) {
    console.error('Error getting transactions:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}


export async function createTransaction(req, res) {
  try {
    const {
      transaction_title,
      transaction_amount,
      transaction_category,
      transaction_type,
      user_id,
      related_user
    } = req.body;

    console.log('Incoming request body:', req.body);

    if (!transaction_title || transaction_amount === undefined || !transaction_category || !transaction_type || !user_id) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const validTypes = ['Income', 'Expense', 'Lend', 'Borrow'];
    if (!validTypes.includes(transaction_type)) {
      return res.status(400).json({ message: 'Invalid transaction type.' });
    }

    if ((transaction_type === 'Lend' || transaction_type === 'Borrow') && !related_user) {
      return res.status(400).json({ message: 'related_user is required for Lend or Borrow' });
    }

    const result = await sql`
      INSERT INTO transactions (
        user_id, transaction_title, transaction_amount,
        transaction_category, transaction_type, related_user
      )
      VALUES (
        ${user_id}, ${transaction_title}, ${transaction_amount},
        ${transaction_category}, ${transaction_type}, ${related_user}
      )
      RETURNING *
    `;

    res.status(201).json({
      message: 'Transaction created successfully',
      transaction: result[0]
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}




export async function deleteTransaction(req,res) {
    try{
            const { id } = req.params;
            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({ message: 'Invalid ID' });
            }
            const result = await sql`
            DELETE FROM transactions
            WHERE id = ${id}
            RETURNING *
            `
    
            if(result.length === 0) {
                return res.status(404).json({ message: 'Transaction not found' });
            }
            res.status(200).json({message: 'Transaction deleted successfully'});
        }catch(error){
            console.error('Error deleting transaction:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
}


export async function getReportByUserId(req,res){
    try {
        const { user_Id } = req.params;
        if (!user_Id){
            return res.status(400).json({ message: 'User ID does not exist' });
        }

        const balanceQuery = await sql`
        SELECT 
            COALESCE(SUM(CASE WHEN transaction_type = 'Income' THEN transaction_amount END), 0) AS income,
            COALESCE(SUM(CASE WHEN transaction_type = 'Expense' THEN transaction_amount END), 0) AS expense,
            COALESCE(SUM(CASE WHEN transaction_type = 'Lend' THEN transaction_amount END), 0) AS lending,
            COALESCE(SUM(CASE WHEN transaction_type = 'Borrow' THEN transaction_amount END), 0) AS borrowing,
            COALESCE(SUM(
                CASE 
                    WHEN transaction_type = 'Income' THEN transaction_amount
                    WHEN transaction_type = 'Expense' THEN -transaction_amount
                    WHEN transaction_type = 'Lend'  THEN transaction_amount
                    WHEN transaction_type = 'Borrow' THEN -transaction_amount
                    ELSE 0
                END
            ), 0) AS balance
        FROM transactions
        WHERE user_id = ${user_Id}
        `;

        res.status(200).json(balanceQuery[0]);

    } catch (error) {
        console.error('Error generating report:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
