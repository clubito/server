import User from "@models/User";
import Message from "@models/Message";
import Club from "@models/Club";

import { Server, Socket } from "socket.io";
import { sendChatNotification } from "@notifications";

import { extractUserIdFromToken } from "../../util/auth";

const table: any = {};

export const chatServer = (io: Server): void => {
    io.on("connection", (socket: Socket) => {
        console.log("New connection");
        socket.on("login", async ({ bearerToken }) => {
            const socketId = socket.id;
            try {
                const userId = await extractUserIdFromToken(bearerToken);
                console.log(`UserId for Socket login is ${userId}`);
                const user = await User.findById(userId).populate({ path: "clubs.club" });
                if (user == null) {
                    // return callback("User is not found");
                    console.log("User is not found");
                    return;
                }
                const clubsBelongToUser = (user?.clubs as any[]).map(userClub => String(userClub.club._id));

                // make the current user to connect to all his/her clubs group
                socket.join(clubsBelongToUser);
                table[socketId] = {
                    userId,
                    userName: user.name,
                    userPicture: user.profilePicture
                };
                console.log(table);
            } catch (err) {
                // return callback(err)
                console.log(err);
                return;
            }
        });


        socket.on("sendMessage", async ({ clubId, body }) => {
            const userObj = table[socket.id];
            if (userObj == null) {
                // return callback(`userObj for socket ${socket.id} is not found`);
                console.log(`userObj for socket ${socket.id} is not found`);
                return;
            }
            // const club = await Club.findById(clubId);
            const timeNow = new Date();
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
            });
            try {
                const club = await Club.findById(clubId);
                if (!club) {
                    // return callback(`Club ${clubId} does not exist`) 
                    console.log(`Club ${clubId} does not exist`);
                    return;
                }
                club.messages.push(message._id);
                await club.save();
                await message.save();
                const currUserRole = (club.members as any[]).find(user => { return user.member.equals(userObj.userId); }).role;
                await sendChatNotification(userObj.userId, clubId, club.name, currUserRole, body);
            } catch (err) {
                // return callback(err);
                console.log(err);
                return;
            }
        });


        // socket.on("joinNewRoom", obj => {

        // })

        socket.on("disconnect", () => {
            delete table[socket.id];
            console.log(`Socket ${socket.id} closed`);
            console.log(table);
        });

    });
};