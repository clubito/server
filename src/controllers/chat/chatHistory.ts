
import Club from "@models/Club";
import User from "@models/User";
import { Request, Response } from "express";

export const getThreadMessages = async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
    try{
        const user = await User.findById(userId)
        .populate({path: "clubs.club", populate: {path: "messages",  options: { sort: {'timestamp': 1}}, populate: {path: "author", select: "profilePicture"}}});
        if (user == null) {
            res.status(500).json({
                error: "User not identified"
            })
            return;
        }
        else if (user.clubs == null) {
            res.status(500).json({
                error: "Club is null for the user"
            })
            return;
        }

        const result: any[] = [];
        user.clubs.forEach(userClub => {
            let latestMessage = userClub.club.messages.pop();
            const latestMessageArray: any[] = [];
            if (latestMessage) {
                latestMessageArray.push({
                    authorId: latestMessage.author._id,
                    authorName: latestMessage.authorName,
                    anotherPicture: latestMessage.author.profilePicture,
                    timestamp: latestMessage.timestamp,
                    body: latestMessage.body
                })
            }  
            // need to filter and select the latest timestamp message
            const answer = {
                clubId: userClub.club._id,
                clubName: userClub.club.name,
                clubLogo: userClub.club.logo,
                messages: latestMessageArray,
                role: userClub.role
            }
            result.push(answer);
        })

        res.status(200).json(result);
        return;

    } catch(err) {
        res.status(500).json({
            error: err
        })
        return;
    }
}