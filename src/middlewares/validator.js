import { body } from "express-validator"

const userValidation = () => {
    return [
        body('userName').notEmpty().isString(),

        body('email').notEmpty().isEmail(),

        body("password").isStrongPassword({
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1,
        }),

        body("phoneNum").isNumeric().optional(),

        body("address").isString().optional()
    ]

} 

export default userValidation
