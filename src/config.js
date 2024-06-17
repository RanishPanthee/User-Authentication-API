import dotenv from 'dotenv'
dotenv.config()

const config = {
    db: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        port: process.env.DB_PORT,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    },

    server : {
        port : process.env.PORT || 8000
    },

    emailConfig : {
        host : process.env.EMAIL_HOST,
        port : process.env.EMAIL_PORT,
        user : process.env.EMAIL_USER,
        pass : process.env.EMAIL_PASS,
        from : process.env.EMAIL_FROM
    },

    key : {
        secretKey : process.env.JWT_SECRET_KEY
    }
}

export default config