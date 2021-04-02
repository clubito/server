import User from "@models/User";
import Message from "@models/Message";

import { Server, Socket } from "socket.io";

const table: any = {};

export const chatServer = (io: Server): void => {
    io.on("connection", (socket: Socket) => {
        console.log("New connection");
        socket.on("login", async (obj, callback) => {
            const socketId = socket.id;
            const userId = obj.userId;
            try {
                const user = await User.findById(userId).populate({path: "clubs.club"});
                if (user == null) return callback("error");
                const clubsBelongToUser = user?.clubs.map(userClub => String(userClub.club._id));
                if(clubsBelongToUser == null) return callback("error");

                // make the current user to connect to all his/her clubs group
                socket.join(clubsBelongToUser);
                table[socketId] = {
                    userId,
                    userName: user.name,
                    userPicture: user.profilePicture
                }
                console.log(table);
            }catch(err){
                return callback("bug")
            }
        })


        socket.on("sendMessage", async ({clubId, body}) => {
            const userObj = table[socket.id];
            // const club = await Club.findById(clubId);
            if (userObj == null) return;
            const timeNow = Date.now();
            socket.to(clubId).emit("sendMessage", {
                clubId: clubId,
                authorId: userObj.userId,
                authorName: userObj.userName,
                authorPicture: userObj.userPicture,
                body: body,
                timestamp: timeNow,
                isSelf: false,
                isDate: false
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
            await message.save();
        })


        // socket.on("joinNewRoom", obj => {
            
        // })

        socket.on("disconnect", () => {
            console.log("Socket is closed");
            delete table[socket.id];
            console.log(table);
        })

    });
}