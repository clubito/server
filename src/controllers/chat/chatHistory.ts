
import Club from "@models/Club";
import User from "@models/User";
import { Request, Response } from "express";
import joi from "joi";
import { ObjectId } from "mongodb";

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

const getMessagesByClubSchema = joi.object().keys({
    id: joi.string().custom((value, helper) => {
        if (ObjectId.isValid(value)) {
            return value;
        } else {
            return helper.message({ custom: "id is not valid" });
        }
    }).required()
});

export const getMessagesByClub = async (req: Request, res: Response): Promise<void> => {
    const { error } = getMessagesByClubSchema.validate(req.query);
    if (error) {
        res.status(400).json({ "error": error.message });
        return;
    }

    const userId = req.userId;
    const clubId = req.query.id;
    try {
        const user = await User.findById(userId)
        .populate({path: "clubs.club", populate: {path: "messages",  options: { sort: {'timestamp': 1}}, populate: {path: "author", select: "profilePicture"}}});
        // const club = await Club.findById(clubId)
        // .populate({path: "messages",  options: { sort: {'timestamp': 1}}, populate: {path: "author", select: "profilePicture"}});
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

        const userClub = (user.clubs as any[]).find(userClub => userClub.club._id == clubId)
   
        if (userClub == null) {
            res.status(500).json({
                error: `No club with the id ${clubId} is found`
            })
            return;
        }
        else if (userClub.club.messages == null) {
            res.status(500).json({
                error: "Messages is null for the club"
            })
            return;
        }

        const messageArray = userClub.club.messages.map(message => {
            return {
                authorId: message.author._id,
                authorName: message.authorName,
                anotherPicture: message.author.profilePicture,
                timestamp: message.timestamp,
                body: message.body
            }
        })

        res.status(200).json({
            clubId: clubId,
            clubName: userClub.club.name,
            clubLogo: userClub.club.logo,
            messages: messageArray,
            role: userClub.role
        });
        return;

    } catch (err) {
        res.status(500).json({
            error: err
        })
        return;
    }
}