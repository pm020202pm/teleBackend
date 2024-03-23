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
        const b = await loginUser(phoneNo, password)
        if (b=="First Sign up") {
            res.json("First sign up")
            
        } else if(b!="First Sign up" && b!=false) {
            res.json(b)
        } else{
            res.json("Error logging in")
        }
    } catch (error) {
        next(error)
    }
}