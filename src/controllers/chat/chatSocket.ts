import User from "@models/User";
import Message from "@models/Message";
import Club from "@models/Club";

import { Server, Socket } from "socket.io";
import {sendChatNotification} from "@notifications";

const table: any = {};

export const chatServer = (io: Server): void => {
    io.on("connection", (socket: Socket) => {
        console.log("New connection");
        socket.on("login", async ({userId}, callback) => {
            const socketId = socket.id;
            try {
                const user = await User.findById(userId).populate({path: "clubs.club"});
                if (user == null) return callback("User is not found");
                const clubsBelongToUser = user?.clubs.map(userClub => String(userClub.club._id));

                // make the current user to connect to all his/her clubs group
                socket.join(clubsBelongToUser);
                table[socketId] = {
                    userId,
                    userName: user.name,
                    userPicture: user.profilePicture
                }
                console.log(table);
            }catch(err){
                return callback(err)
            }
        })


        socket.on("sendMessage", async ({clubId, body}, callback) => {
            const userObj = table[socket.id];
            if (userObj == null) return callback(`userObj for socket ${socket.id} is not found`);
            // const club = await Club.findById(clubId);
            const timeNow = Date.now();
            socket.to(clubId).emit("sendMessage", {
                clubId: clubId,
                chatMessage: {
                    authorId: userObj.userId,
                    authorName: userObj.userName,
                    authorPicture: userObj.userPicture,
                    body: body,
                    timestamp: timeNow,
                    isSelf: false,
                    isDate: false
                }
            });
        
            // add to database
            const message = new Message({
                author: userObj.userId,
                authorName: userObj.userName,
                club: clubId,
                timestamp: timeNow,
                body: body,
                attachement: ""
            })
            try {
                const club = await Club.findById(clubId);
                if (!club) {
                    return callback(`Club ${clubId} does not exist`) 
                } 
                club?.messages.push(message._id);
                await club.save();
                await message.save();
                const currUserRole = (club.members as any[]).find(user => { return user.member.equals(userObj.userId); }).role;
                await sendChatNotification(userObj.userId, clubId, club.name, currUserRole, body);
            } catch (err) {
                return callback(err);
            }
        })


        // socket.on("joinNewRoom", obj => {
            
        // })

        socket.on("disconnect", () => {
            delete table[socket.id];
            console.log(`Socket ${socket.id} closed`);
            console.log(table);
        })

    });
}