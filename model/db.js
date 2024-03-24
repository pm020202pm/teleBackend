import { Schema, connect, model } from "mongoose";
import { createHash } from "node:crypto";
import { dbUri } from "../config.js";
import { StringSession } from "telegram/sessions/index.js";
import { CONNECTION_RETRIES, apiCred } from "../config.js";
import { TelegramClient, Api } from "telegram";

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

export const deleteFile = async (req,res, next) => {
    const docId = req.body.docId
    const telegramId = req.body.telegramId
    const parentId = req.body.parentId
    const user = req.body.user
    const sessionString = user.session
    const session = new StringSession(sessionString)
    const client = new TelegramClient(session,apiCred.apiId,apiCred.apiHash,{connectionRetries:CONNECTION_RETRIES})
    await client.connect()
    await client.deleteMessages("me",[Number(telegramId)], {revoke:true})
    if(user._id == parentId){
        user.files = user.files.filter(file => file._id != docId)
    }
    else {
        const n = user.collections.length
        for(let i=0; i<n; i++){
            if(user.collections[i]._id == parentId){
                user.collections[i].files = user.collections[i].files.filter(file => file._id != docId)
                break;
            }
        }
    }
    await user.save();
    res.json("deleted successfully")
}


export const deleteFolder = async (req,res, next) => {
    const folderId = req.body.folderId
    const parentFolderId = req.body.parentFolderId
    const user = req.body.user
    const sessionString = user.session
    const session = new StringSession(sessionString)
    const client = new TelegramClient(session,apiCred.apiId,apiCred.apiHash,{connectionRetries:CONNECTION_RETRIES})
    await client.connect()

    let ind;
    for(let i=0; i<user.collections.length; i++){
        if(user.collections[i]._id == folderId){
            ind = i;
            break;
        }
    }
        let fidArray = [];
        let folderIdArray = [];
        folderIdArray.push(folderId);
        async function iterateFolders(ind){
            let array = user.collections[ind].files;
            console.log(array)
            for (let i = 0; i < array.length; ++i) {
                let id = array[i]._id;
                let fId = array[i].id;
                let type = array[i].type;
                if(type == "file"){
                    fidArray.push(Number(fId));
                    user.collections[Number(ind)].files = user.collections[Number(ind)].files.filter(file => file._id != id)
                }
                else if(type == "folder") {
                    folderIdArray.push(fId);
                    for(let i=0; i<user.collections.length; i++){
                        if(user.collections[i]._id == fId){
                            iterateFolders(i);
                        }
                    }
                }
            }
        }
        iterateFolders(ind);
        await client.deleteMessages("me",fidArray, {revoke:true})
        for(let i=0; i<folderIdArray.length; i++){
            user.collections = user.collections.filter(folder => folder._id != folderIdArray[i]);
        }
        user.collections[parentFolderId].files = user.collections[parentFolderId].files.filter(folder => folder.id != folderId);

    await user.save();
    res.json("working on folders ...............")
}