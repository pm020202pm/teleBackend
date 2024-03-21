import { StringSession } from "telegram/sessions/index.js";
import { CONNECTION_RETRIES, apiCred } from "../config.js";
import { TelegramClient, Api } from "telegram";
import { promises as fs } from 'fs';


export const getAllFilesFromACollection = (req,res) => {
    const user = req.body.user
    const docId = req.body.docId
    console.log(user._id)
    if(user._id == docId){
        res.json(user.files)
    }
    else{
        const length = user.collections.length
        for(let i=0; i<length; i++){
            if(user.collections[i]._id == docId){
                res.json(user.collections[i].files)
            }
        }
    }
    
}

export const getAFile= async (req,res, next) => {
    const fileId = req.body.fileId
    const fileName = req.body.fileName
    const user = req.body.user
    const sessionString = user.session
    const session = new StringSession(sessionString)
    const client = new TelegramClient(session, apiCred.apiId, apiCred.apiHash, { connectionRetries: CONNECTION_RETRIES })
    await client.connect()
    const id = Number(fileId)
    console.log(id)
    const item = await client.getMessages("me", {ids:id})
    const buffer = await client.downloadMedia(item[0],{})
    await fs.writeFile("files/"+fileName,buffer);
    await user.save();
    await client.disconnect();
    res.sendfile("files/"+fileName);
}

export const checkLogin = (req,res) => {
    const user = req.body.user
    res.json(user)
}

export const createCollection = async (req,res) => {
    const{name,user, docId} = req.body

    var data = user.collections.push({
        name:name,
        files:[]
    })
    const id = user.collections[data-1]._id.toString()

    if(user._id == docId){
        user.files.push({
            id: id,
            name: name,
            type: "folder"
        })
    }
    else{
        console
        const length = user.collections.length
        for(let i=0; i<length; i++){
            if(user.collections[i]._id == docId){
                user.collections[i].files.push({
                    id: id,
                    name: name,
                    type: "folder"
                });
            }
        }
    }
    await user.save()
    res.json("Created successfully")
}

export const addToCollection = async (req,res, next) => {
    if (!req.files) {
        return res.status(400).send('No files were uploaded.');
    }
    const docId = req.body.docId
    const file = req.files.map((file) => file.filename);
    const originalFileName = req.fileOrgName
    const size = file.length;
    const user = req.body.user
    const sessionString = user.session
    const session = new StringSession(sessionString)
    const client = new TelegramClient(session,apiCred.apiId,apiCred.apiHash,{connectionRetries:CONNECTION_RETRIES})
    await client.connect()
    for (let i = 0; i< size; i++) {
        var item = await client.sendFile("me",{file:`files/${file[i]}`,caption:originalFileName}) 
        if(user._id == docId){
            user.files.push({
                id: item.id,
                name: originalFileName,
                type: "file"
            })
        }
        else{
            const size = user.collections.length
            for(let i=0; i<size; i++){
                if(user.collections[i]._id == docId){
                    user.collections[i].files.push({
                        id: item.id,
                        name: originalFileName,
                        type: "file"
                    })
                    break;
                }
            }
        }
    }
    await user.save();
    await client.disconnect()
    res.json("file uploaded successfully")
}



