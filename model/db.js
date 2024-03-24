import { Schema, connect, model } from "mongoose";
import { createHash } from "node:crypto";
import { dbUri } from "../config.js";

const fileSchema = new Schema({
    id:{
        type:String,
        required:true,
    },
    name:{
        type:String,
        required: true,
    },
    type:{
        type:String,
        required:true,
    },
})

const collectionSchema = new Schema({
    name:{
        type:String,
        required:true,
    },
    files:{
        type:[fileSchema],
        required:true,
        default:[],
    },
    type:{
        type:String,
        default:"folder"
    }
})

const userSchema = new Schema({
    phoneNo: {
        type: String,
        required: true,
        unique: true,
    },
    session: {
        type: String,
    },
    password: {
        type: String,
        required: true,
    },
    files:{
        type:[fileSchema],
        default: [],
    },
    collections:{
        type:[collectionSchema],
        default:[],
    }
})

connect(dbUri).then(console.log("Connected to DATABASE")).catch(err => console.error(err))

const User = model('User', userSchema)

export const signUpUser = async (phoneNo, password) => {
    try {
        const passHash = createHash('sha256').update(password).digest('hex')
        const user = new User({phoneNo,password:passHash})
        await user.save()
        return user
    } catch (err) {
        console.error("Error signing up:", err);
        throw new Error("Error Signing Up");
    }
}

export const loginUser = async (phoneNo, password) => {
    try {
        const user = await User.findOne({ phoneNo })
        const passHash = createHash('sha256').update(password).digest('hex');
        console.log(user)
        if(user==null) return "First Sign up";
        if (user.password === passHash) return user._id;
        return false;
    } catch (error) {
        throw new Error("Error Logging in")
    }
}

export const tokenDb = async (token) => {
    try {
        const user = await User.findById(token);
        return user
    } catch (error) {
        throw new Error("Error Occured")
    }
}

export const saveStringSession = async (phoneNo, session) => {
    try {
        const user = await User.findOneAndUpdate({ phoneNo: phoneNo }, { session: session })
    } catch (error) {
        throw new Error("Error Occured")
    }
}