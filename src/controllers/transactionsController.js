import { sql } from "../config/db.js";

export async function getTransactionsByUserId(req, res) {
    try {
        const { user_Id } = req.params;
        const { type } = req.query;

        if (!user_Id){
            return res.status(400).json({ message: 'User does not exist. User ID is required.' });
        }

        const query = type
          ? sql`SELECT * FROM transactions WHERE user_id = ${user_Id} AND transaction_type = ${type} ORDER BY created_at DESC`
          : sql`SELECT * FROM transactions WHERE user_id = ${user_Id} ORDER BY created_at DESC`;

        const transactions = await query;

        res.status(200).json(transactions);
    } catch (error) {
        console.error('Error getting transactions:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}


export async function createTransaction(req, res){
    try {
        const {
            transaction_title,
            transaction_amount,
            transaction_category,
            transaction_type,
            user_id
        } = req.body;
        
        // Validate input
        if (!transaction_title || transaction_amount === undefined || !transaction_category || !transaction_type || !user_id) {
            return res.status(400).json({ message : 'All fields are required' });
        }

        const validTypes = ['Income', 'Expense', 'Lend', 'Borrow'];
        if (!validTypes.includes(transaction_type)) {
            return res.status(400).json({ message: 'Invalid transaction type. Must be Income, Expense, Lend, or Borrow.' });
        }

        const transaction = await sql`
        INSERT INTO transactions (user_id, transaction_title, transaction_amount, transaction_category, transaction_type)
        VALUES (${user_id}, ${transaction_title}, ${transaction_amount}, ${transaction_category}, ${transaction_type})
        RETURNING *
        `;
        
        res.status(201).json({
            message: 'Transaction created successfully',
            transaction: transaction[0]
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
