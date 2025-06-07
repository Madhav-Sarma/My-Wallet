import { sql } from "../config/db.js";

export async function getTransactionsByUserId(req,res){
    try {
        const { user_Id } = req.params;
        // Validate user_Id
        if (!user_Id){
            return res.status(400).json({ message: 'User doesnot exist. User is required' });
        }
        const transactions = await sql`
        SELECT * FROM transactions 
        WHERE user_id = ${user_Id} 
        ORDER BY created_at DESC
        `
        res.status(200).json(transactions);
    }catch(error){
        console.error('Error getting transactions:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
} 


export async function createTransaction(req, res){
    //title, amount, category,user_id
    try {
        const {
            transaction_title,
            transaction_amount,
            transaction_category,
            user_id
        } = req.body;
        
        // Validate input
        if (!transaction_title || transaction_amount === undefined || !transaction_category || !user_id) {
            return res.status(400).json({ message : 'All fields are required' });
        }

        const transaction = await sql`
        INSERT INTO transactions (user_id, transaction_title, transaction_amount, transaction_category)
        VALUES (${user_id}, ${transaction_title}, ${transaction_amount}, ${transaction_category})
        RETURNING *
        `
        res.status(201).json({
            message: 'Transaction created successfully',
            transaction: transaction[0] // Return the created transaction
        });
    }catch(error){
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
    try{
        const {user_Id} = req.params;
        if (!user_Id){
            return res.status(400).json({ message: 'User ID does not exist' });
        }
        
        const balanceQuery = await sql`
        SELECT 
            COALESCE(SUM(CASE WHEN transaction_category = 'income' THEN transaction_amount END), 0) AS income,
            COALESCE(SUM(CASE WHEN transaction_category = 'expense' THEN transaction_amount END), 0) AS expense,
            COALESCE(SUM(CASE WHEN transaction_category = 'lend' THEN transaction_amount END), 0) AS lending,
            COALESCE(SUM(CASE WHEN transaction_category = 'borrow' THEN transaction_amount END), 0) AS borrowing,
            COALESCE(SUM(
                CASE 
                    WHEN transaction_category = 'income' THEN transaction_amount
                    WHEN transaction_category = 'expense' THEN -transaction_amount
                    WHEN transaction_category = 'lend'  THEN transaction_amount
                    WHEN transaction_category = 'borrow' THEN -transaction_amount
                    ELSE 0
                END
            ), 0) AS balance
        FROM transactions
        WHERE user_id = ${user_Id}
        `;


        const incomeQuery = await sql`
        SELECT COALESCE(SUM(transaction_amount),0) AS income
        FROM transactions
        WHERE user_id = ${user_Id} AND transaction_category = 'income'
        `;

        const expenseQuery = await sql`
        SELECT COALESCE(SUM(transaction_amount),0) AS expense
        FROM transactions
        WHERE user_id = ${user_Id} AND transaction_category = 'expense'
        `;

        const lendingQuery = await sql`
        SELECT COALESCE(SUM(transaction_amount), 0) AS lending
        FROM transactions
        WHERE user_id = ${user_Id} AND transaction_category = 'lend'
        `;

        const borrowingQuery = await sql`
        SELECT COALESCE(SUM(transaction_amount), 0) AS borrowing
        FROM transactions
        WHERE user_id = ${user_Id} AND transaction_category = 'borrow'
        `;

        //const balanceQuery=incomeQuery[0].income - expenseQuery[0].expense;


        res.status(200).json({
            balance: balanceQuery[0].balance,
            //balance: balanceQuery,
            income: incomeQuery[0].income,
            expense: expenseQuery[0].expense,
            lending: lendingQuery[0].lending,
            borrowing: borrowingQuery[0].borrowing
        });

    }catch(error){
        console.error('Error generating report:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}