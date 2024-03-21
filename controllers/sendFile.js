// import { StringSession } from "telegram/sessions/index.js";
// import { CONNECTION_RETRIES, apiCred } from "../config.js";
// import { TelegramClient} from "telegram";
// export const FileHandler = async (req, res,next) => {
//     if (!req.files) {
//         return res.status(400).send('No files were uploaded.');
//     }
//     const file = req.files.map((file) => file.filename);
//     const originalFileName = req.fileOrgName
//     const size = file.length;
//     const user = req.body.user
//     const sessionString = user.session
//     const session = new StringSession(sessionString)
//     const client = new TelegramClient(session,apiCred.apiId,apiCred.apiHash,{connectionRetries:CONNECTION_RETRIES})
//     await client.connect()
//     var item=null;
//     for (let i = 0; i< size; i++) {
//         item = await client.sendFile("me",{file:`files/${file[i]}`,caption:originalFileName}) 
//         user.files.push({
//             id: item.id,
//             name: originalFileName,
//             type: "file"
//         });
//     }
//     await user.save();
//     await client.disconnect()
//     res.json("file uploaded successfully")
// }