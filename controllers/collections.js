import { StringSession } from "telegram/sessions/index.js";
import { CONNECTION_RETRIES, apiCred } from "../config.js";
import { TelegramClient, Api } from "telegram";
import { promises as fs } from 'fs';


export const getAllFilesFromACollection = (req,res) => {
    const user = req.body.user
    const docId = req.body.docId
    console.log(user._id)
    if(user._id == docId){
        res.json({
            "id": -1,
            "files": user.files,    
        })
    }
    else{
        const length = user.collections.length
        for(let i=0; i<length; i++){
            if(user.collections[i]._id == docId){
                console.log(i)
                res.json({
                    "id": i,
                    "files": user.collections[i].files
                })
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
    await fs.writeFile("files/"+fileName,buffer).then(() => {res.sendfile("files/"+fileName);});
    await user.save();
    await client.disconnect();
    await fs.unlink("files/"+fileName);
}

export const deleteFile = async (req,res, next) => {
    const {docId, telegramId, parentId, user} = req.body
    const sessionString = user.session
    const session = new StringSession(sessionString)
    const client = new TelegramClient(session,apiCred.apiId,apiCred.apiHash,{connectionRetries:CONNECTION_RETRIES})
    await client.connect()
    await client.deleteMessages("me",[Number(telegramId)], {revoke:true})
    if(user._id == parentId) user.files = user.files.filter(file => file._id != docId);
    else {
        for(let i=0; i<user.collections.length; i++){
            if(user.collections[i]._id == parentId){
                user.collections[i].files = await user.collections[i].files.filter(file => file._id != docId)
                break;
            }
        }
    }
    await user.save();
    res.json("file deleted successfully")
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
    const originalFileName = req.files.map((file) => file.originalname);
    const size = file.length;
    const user = req.body.user
    const sessionString = user.session
    const session = new StringSession(sessionString)
    const client = new TelegramClient(session,apiCred.apiId,apiCred.apiHash,{connectionRetries:CONNECTION_RETRIES})
    await client.connect()
    for (let i = 0; i< size; i++) {
        let fName = originalFileName[i]
        var item = await client.sendFile("me",{file:`files/${file[i]}`,caption:originalFileName[i]}) 
        if(user._id == docId){
            user.files.push({
                id: item.id,
                name: fName,
                type: "file"
            })
        }
        else{
            const size = user.collections.length
            for(let j=0; j<size; j++){
                if(user.collections[j]._id == docId){
                    user.collections[j].files.push({
                        id: item.id,
                        name: fName,
                        type: "file"
                    })
                    break;
                }
            }
        }
        await fs.unlink(`files/${file[i]}`);

    }
    await user.save();
    await client.disconnect()
    res.json("file uploaded successfully")
}




export const deleteFolder = async (req,res, next) => {
    const {folderId, parentFolderId, user} = req.body
    const sessionString = user.session
    const session = new StringSession(sessionString)
    const client = new TelegramClient(session,apiCred.apiId,apiCred.apiHash,{connectionRetries:CONNECTION_RETRIES})
    await client.connect()

    let ind;
    let fidArray = [];
    let folderIdArray = [];
    folderIdArray.push(folderId);
    for(let i=0; i<user.collections.length; i++){
        if(user.collections[i]._id == folderId){
            ind = i;
            break;
        }
    }
        
    async function iterateFolders(ind){
        let array = user.collections[ind].files;
        for (let i = 0; i < array.length; ++i) {
            let id = array[i]._id;
            let fId = array[i].id;
            let type = array[i].type;
            if(type == "file"){
                fidArray.push(Number(fId));
                user.collections[Number(ind)].files = await user.collections[Number(ind)].files.filter(file => file._id != id)
            }
            else if(type == "folder") {
                folderIdArray.push(fId);
                for(let i=0; i<user.collections.length; i++){
                    if(user.collections[i]._id == fId) iterateFolders(i);
                }
            }
        }
    }
    iterateFolders(ind);
    await client.deleteMessages("me",fidArray, {revoke:true})
    for(let i=0; i<folderIdArray.length; i++) user.collections = await user.collections.filter(folder => folder._id != folderIdArray[i]);
    if(parentFolderId==user._id) user.files = await user.files.filter(folder => folder.id != folderId);
    else user.collections[parentFolderId].files = await user.collections[parentFolderId].files.filter(folder => folder.id != folderId);
    await user.save();
    res.json("working on folders ...............")
}



