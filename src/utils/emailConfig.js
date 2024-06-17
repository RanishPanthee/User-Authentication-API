import config from '../config.js'
import nodemailer from 'nodemailer'

let transporter = nodemailer.createTransport({
  host: config.emailConfig.host,
  port: config.emailConfig.port,
  secure: false, // true for 465, false for other ports
  auth: {
    user: config.emailConfig.user, // Admin Gmail ID
    pass: config.emailConfig.pass, // Admin Gmail Password
  },
})

export default transporter