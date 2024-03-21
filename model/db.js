import { Schema, connect, model } from "mongoose";
import { createHash } from "node:crypto";
import { dbUri } from "../config.js";
import { StringSession } from "telegram/sessions/index.js";
import { CONNECTION_RETRIES, apiCred } from "../config.js";
import { TelegramClient, Api } from "telegram";
import { MongoClient, ObjectId } from 'mongodb';

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
    // const folderId = req.body.folderId
    // const messageId = req.body.messageId
    const user = req.body.user
    const sessionString = user.session
    const session = new StringSession(sessionString)
    const client = new TelegramClient(session,apiCred.apiId,apiCred.apiHash,{connectionRetries:CONNECTION_RETRIES})
    await client.connect()
    // const id =Number(messageId)

    // await client.deleteMessages("me",id, {revoke:true})
    // const messages = [id]

    console.log(docId)

    const uri = 'mongodb+srv://admin:admin@cluster0.ys061bp.mongodb.net/';
    const dbName = 'collections';
    const clientMongo = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    clientMongo.connect(async function(err) {
      if (err) {
        console.error('Error occurred while connecting to MongoDB Atlas', err);
        return;
      }
      console.log('Connected successfully to MongoDB Atlas');
      const db = client.db(dbName);
    //   const parentCollection = db.collection('parentCollection');
      
      try {
        const parentIdToDelete = new ObjectId(docId);
        const deleteResult = await parentCollection.deleteOne({ _id: parentIdToDelete });
    
        if (deleteResult.deletedCount === 1) {
          console.log('Document deleted successfully');
        } else {
          console.log('Document not found or not deleted');
        }
      } catch (error) {
        console.error('Error occurred while deleting document:', error);
      } finally {
        clientMongo.close();
      }
    });
    

    // var rs = await User..findByIdAndDelete(docId)
    // console.log(rs)
    // user.find({ id:docId }).remove().exec();
    // await client.deleteMessages("me",messages, {revoke:true})
    // const size = user.collections.length
    //         for(let i=0; i<size; i++){
    //             if(user.collections[i]._id == folderId){
    //                 user.collections[i].files.findByIdAndRemove(docId)
    //                 break;
    //                 // const fileLength = user.collections[i].files.length
    //                 // for(let j=0; j<fileLength; j++){
    //                 //     if(user.collections[i].files[j]._id == docId){
    //                 //         user.collections[i].files.deleteOne({_id: new mongodb.ObjectID(docId)})
    //                 //         break;
    //                 //     }
    //                 // }
    //             }
    //         }
    await user.save();
    await client.disconnect()
    res.json("file uploaded successfully")
}