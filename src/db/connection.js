import pkg from 'pg';
const {Pool} = pkg;
import dotenv from 'dotenv'
dotenv.config()

const pool = new Pool ({
    host : "localhost",
    user : "postgres",
    port : 5432,
    password : "ranish023",
    database : "user"

})

const connectDB = async () => {
        try {
            await pool.connect();;
            console.log('Connection has been established successfully!!!');
        } catch (error) {
            console.error('Unable to connect to the database:', error);
        }
    }

export { pool, connectDB };
