import pkg from 'pg';
const {Pool} = pkg;
import config from '../config.js';

const pool = new Pool ({
    host : config.db.host,
    user : config.db.user,
    port : config.db.port,
    password : config.db.password,
    database : config.db.database

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
