import jwt from 'jsonwebtoken';
import { pool } from '../db/connection.js';
import config from '../config.js';

const secret_key = config.key.secretKey;

const checkAuth = async (req, res, next) => {
    let token;
    const { authorization } = req.headers;

    if (authorization && authorization.startsWith('Bearer')) {
        try {
            token = authorization.split(' ')[1];

            const decoded = jwt.verify(token, secret_key);
            const { userID } = decoded;

            const result = await pool.query(`SELECT userid, username, email, address FROM registration WHERE userid = $1`, [userID]);

            if (result.rows.length === 0) {
                return res.status(401).send({
                    message: "Unauthorized user"
                });
            }

            req.user = result.rows[0];
            next();
        } catch (error) {
            console.log(error)
            return res.status(401).send({
                message: "Unauthorized user"
            });
        }
    } else {
        return res.status(401).send({
            message: "No token found"
        });
    }
};

export default checkAuth;