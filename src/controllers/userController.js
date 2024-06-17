import bcrypt from 'bcrypt';
import { validationResult } from 'express-validator';
import { pool } from '../db/connection.js';
import jwt from 'jsonwebtoken';
import config from '../config.js';
import transporter from '../utils/emailConfig.js';


const secret_key = config.key.secretKey;

class userController {
    static userRegister = async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { userName, email, password, address, phoneNum } = req.body;

        try {
            const results = await pool.query(`SELECT email FROM registration WHERE email = $1`, [email]);

            if (results.rows.length > 0) {
                return res.status(400).json({
                    message: "Email already registered"
                });
            } else {
                const salt = bcrypt.genSaltSync(10);
                const hashPassword = bcrypt.hashSync(password, salt);
                console.log(hashPassword);

                const insertResult = await pool.query(
                    `INSERT INTO registration (userName, email, password, address, phoneNum) VALUES ($1, $2, $3, $4, $5) RETURNING userName, email, password, address, phoneNum`,
                    [userName, email, hashPassword, address, phoneNum]
                );

                const saved_user = await pool.query(`SELECT userid, email FROM registration WHERE email = $1`, [email]);
                const user_id = saved_user.rows[0].userid;
                const token = jwt.sign({ userID: user_id }, secret_key, { expiresIn: '30m' });
                const link = `http://localhost:8000/user/verifyEmail/${user_id}/${token}`;
                const insert_token = await pool.query(`INSERT INTO tokens (userid, tokens) VALUES ($1, $2) RETURNING userid, tokens`,
                    [user_id, token]);

                let emailInfo = await transporter.sendMail({
                    from: config.emailConfig.from,
                    to: saved_user.rows[0].email,
                    subject: "User Authentication- Email Verification Link",
                    html: `<p>Dear ${userName},</p>
                        <p>Thank you for registering. Please click the button below to verify your email address.</p>
                        <a href="${link}" class="button">Verify Email</a>`
                });

                return res.status(200).json({
                    message: "User registered successfully, please verify your email using the link sent to your email"
                });
            }
        } catch (error) {
            console.error("Error during user registration:", error);
            return res.status(500).json({
                message: "An error occurred during registration"
            });
        }
    }

    static verifyEmail = async (req, res) => {
        const { userid, token } = req.params;
        if (userid && token) {
            const results = await pool.query(`SELECT userid, email FROM registration WHERE userid = $1`, [userid]);
            if (results.rows.length > 0) {
                try {
                    jwt.verify(token, secret_key)
                    await pool.query(`UPDATE registration SET isverified = true WHERE userid = $1`, [userid])
                    return res.json('Your email has been verified')
                } catch (err) {
                    console.log(err);
                    throw err;
                }
            }

        }
        else {
            return res.status(500).json({
                message: "An error occurred during email verification"
            });
        }
    }

    static userLogin = async (req, res) => {
        try {
            const { email, password } = req.body;
            if (email && password) {
                const results = await pool.query(`SELECT * FROM registration WHERE email = $1`, [email]);

                const isVerified = results.rows[0].isverified

                if ((results.rows.length > 0) && isVerified) {
                    const user = results.rows[0];
                    const matchedUser = await bcrypt.compare(password, user.password);
                    if (user.email === email && matchedUser) {
                        const user = await pool.query(`SELECT userid, email FROM registration WHERE email = $1`, [email]);
                        const token = jwt.sign({ userID: user.rows[0].userid }, secret_key, { expiresIn: '5d' });
                        const user_id = user.rows[0].userid;
                        await pool.query(`
                        INSERT INTO tokens (userid, tokens)
                        VALUES ($1, $2)
                        ON CONFLICT (userid)
                        DO UPDATE SET tokens = EXCLUDED.tokens
                        RETURNING userid, tokens;`, [user_id, token]);

                        return res.status(200).json({
                            message: "User logged in successfully",
                            token: token
                        });
                    } else {
                        return res.status(401).json({
                            message: "Invalid credentials"
                        });
                    }
                } else {
                    return res.status(401).json({
                        message: "Email not registered or is not verified"
                    });
                }
            } else {
                return res.status(400).json({
                    message: "All fields are required"
                });
            }
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                message: "An error occurred during login"
            });
        }
    }

    static changePassword = async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const { newPassword, confirmPassword } = req.body;
            if (newPassword && confirmPassword) {
                if (newPassword != confirmPassword) {
                    return res.status(500).json({
                        messgae: "password doesnot match"
                    })
                }
                else {
                    const salt = bcrypt.genSaltSync(10);
                    const newhashPassword = bcrypt.hashSync(newPassword, salt);
                    const user_id = req.user.userid
                    await pool.query(
                        'UPDATE registration SET password = $1 WHERE userid = $2 RETURNING userid, username, email',
                        [newhashPassword, user_id]
                    );
                    return res.status(200).json({
                        message: "password changed successfully"
                    })
                }
            }
            else {
                return res.status(400).json({
                    message: "All fields are required"

                });
            }

        } catch (err) {
            console.log(err)
            return res.status(500).json({
                message: "Error occured"
            });

        }
    }


    static sendVerificationEmail = async (req, res) => {
        try {
            const { email } = req.body;
            const user = await pool.query(`SELECT userid, isverified, email FROM registration WHERE email = $1`, [email]);

            console.log(user.rows[0])
            const verifiedUser = user.rows[0].isverified

            if (email) {
                if (user.rows.length > 0 && verifiedUser) {
                    const token = jwt.sign({ userID: user.rows[0].userid }, secret_key, { expiresIn: '10m' });
                    const link = `http://localhost:8000/user/send-verification-mail/${user.rows[0].userid}/${token}`


                    await transporter.sendMail({
                        from: config.emailConfig.from,
                        to: user.rows[0].email,
                        subject: "Forgotten Password Reset Link",
                        html: `<p>Dear ${user.rows[0].username},</p>
                            <p>Your password reset link is as below, Click the link below to reset your forgotten paswword</p>
                            <a href=${link} class="button">Reset Forgotten Password</a>`
                    })

                    return res.status(200).json({
                        message: "user email found, verfiication link is sent to the email"
                    });

                }
                else {
                    return res.status(400).json({
                        message: "User not registered or email is not verified"
                    })
                }


            }
            else {
                return res.status(400).json({
                    message: "Email field is required"
                })
            }

        } catch (error) {
            console.log(error)
            return res.status(500).json({
                message: "Error occurred"
            })

        }
    }


    static changeForgottenPassword = async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { password, confirmPassword } = req.body
        const { userid, tokens } = req.params

        const user = await pool.query(`SELECT userid, email FROM registration WHERE userid = $1`, [userid]);

        try {
            jwt.verify(tokens, secret_key)
            if (password && confirmPassword) {
                if (password !== confirmPassword) {
                    return res.status(500).json({
                        message: "Password doesnot match"
                    })
                }
                else {
                    const salt = bcrypt.genSaltSync(10);
                    const newhashPassword = bcrypt.hashSync(password, salt);
                    const user_id = user.userid
                    await pool.query(
                        'UPDATE registration SET password = $1 WHERE userid = $2 RETURNING userid, username, email',
                        [newhashPassword, user_id]
                    );
                    return res.status(200).json({
                        message: "Password reset successfully"
                    })
                }
            }
            else {
                return res.status(500).json({
                    message: "password and cofirmed password is not provided"
                })

            }

        } catch (error) {
            console.log(error)
            return res.status(500).json({
                message: "Error occured"
            })

        }
    }

    static updateUserDetails = async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { newUserName, newAddress, newPhoneNum } = req.body
            if (newUserName || newAddress || newPhoneNum) {

                const user_id = req.user.userid
                await pool.query(
                    'UPDATE registration SET username = $1, address = $2, phonenum = $3 WHERE userid = $4 RETURNING userid, username, email, address, phonenum',
                    [newUserName, newAddress, newPhoneNum, user_id]
                );

                return res.status(200).json({
                    message: "User details changed successfully"
                })

            }
            else {
                return res.status(400).json({
                    message: "fields to be updated are not provided"

                });
            }

        } catch (err) {
            console.log(err)
            return res.status(500).json({
                message: "Error occured"
            });

        }
    }

    static getUsers = async (req, res) => {
        try {
            const results = await pool.query(`SELECT userName, email, address, phoneNum FROM registration`);
            return res.status(200).json(results.rows);
        } catch (err) {
            return res.status(500).json({
                message: "error occurred during retrieval"
            });
        }
    }
}

export default userController;
