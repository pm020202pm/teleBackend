import { loginUser, signUpUser } from "../model/db.js"

export const test = (req, res) => {
    res.send("Hello")
}

export const errorTest = (req, res) => {
    throw new Error("Error test")
}

export const signUpHandler = async (req, res,next) => {
    try {
        const { phoneNo, password } = req.body
        const user = await signUpUser(phoneNo, password)
        res.json(user._id)
    } catch (error) {
        next(error)
    }
}

export const loginHandler = async (req, res, next) => {
    try {
        const { phoneNo, password } = req.body
        console.log(phoneNo,password)
        const b = await loginUser(phoneNo, password)
        if (b) {
            res.json({ token: b })
        } else {
            res.json("Error Logging in")
        }
    } catch (error) {
        next(error)
    }
}