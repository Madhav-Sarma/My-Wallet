import {neon} from '@neondatabase/serverless';
import {config} from 'dotenv';

config();
// creates a SQL connetion using neon database
export const sql = neon(process.env.DATABASE_URL);


export async function connectToDatabase() {
    try{
        await sql`CREATE TABLE IF NOT EXISTS transactions (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            transaction_title VARCHAR(255) NOT NULL,
            transaction_amount DECIMAL(10, 2) NOT NULL,
            transaction_category VARCHAR(255) NOT NULL,
            transaction_type VARCHAR(50) NOT NULL,
            related_user VARCHAR(255), -- NEW FIELD
            created_at DATE NOT NULL DEFAULT CURRENT_DATE
        )
        `

        console.log('Database connected and table created successfully');  
    }catch (error) {
        console.log('Error connecting to the database:', error);
        process.exit(1); // Exit the process with failure -- code 1 meansd failure and 0 means success
    }
}
