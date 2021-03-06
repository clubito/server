/* eslint-disable @typescript-eslint/no-explicit-any */

import User from "@models/User";
import { Request, Response } from "express";
import joi from "joi";
import { ObjectId } from "mongodb";

export const getThreadMessages = async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
    try {
        const user = await User.findById(userId)
            .populate({ path: "clubs.club", populate: { path: "messages", options: { sort: { "timestamp": 1 } }, populate: { path: "author", select: "profilePicture" } } });

        if (user == null) {
            res.status(500).json({
                error: "User not identified"
            });
            return;
        }

        const result: any[] = [];
        if (user.clubs) {
            user.clubs.forEach(userClub => {
                const latestMessage = userClub.club.messages.pop();
                const latestMessageArray: any[] = [];
                if (latestMessage) {
                    latestMessageArray.push([{
                        authorId: latestMessage.author._id,
                        authorName: latestMessage.authorName,
                        anotherPicture: latestMessage.author.profilePicture,
                        timestamp: latestMessage.timestamp,
                        body: latestMessage.body,
                        isSelf: (latestMessage.author._id.equals(userId) ? true : false),
                        isDate: false
                    }]);
                }
                // need to filter and select the latest timestamp message
                const answer = {
                    clubId: userClub.club._id,
                    clubName: userClub.club.name,
                    clubLogo: userClub.club.logo,
                    messages: latestMessageArray,
                    role: userClub.role2
                };
                result.push(answer);
            });
        }

        res.status(200).json(result);
        return;

    } catch (err) {
        res.status(200).json([]);
        return;
    }
};

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
            .populate({ path: "clubs.club", populate: { path: "messages", options: { sort: { "timestamp": 1 } }, populate: { path: "author", select: "profilePicture" } } });

        // const club = await Club.findById(clubId)
        // .populate({path: "messages",  options: { sort: {'timestamp': 1}}, populate: {path: "author", select: "profilePicture"}});
        if (user == null) {
            res.status(500).json({
                error: "User not identified"
            });
            return;
        }
        else if (user.clubs == null) {
            res.status(500).json({
                error: "Club is null for the user"
            });
            return;
        }

        const userClub = (user.clubs as any[]).find(userClub => userClub.club._id == clubId);

        if (userClub == null) {
            res.status(500).json({
                error: `No club with id ${clubId} is found for user ${user.name}`
            });
            return;
        } else if (userClub.club == null) {
            res.status(500).json({
                error: "club field is null for the Club"
            });
            return;
        }

        let userMessageArray: any[] = [];
        const messageArray: any[] = [];


        if (userClub.club.messages && userClub.club.messages.length > 0) {
            let prevDate = new Date("1970-01-01");
            let currentUser = userClub.club.messages[0].author._id;
            userClub.club.messages.forEach(message => {
                if (new Date(message.timestamp).setHours(0, 0, 0, 0) > new Date(prevDate).setHours(0, 0, 0, 0)) {
                    prevDate = new Date(message.timestamp);
                    if (userMessageArray.length > 0) {
                        messageArray.push(userMessageArray);
                        userMessageArray = [];
                    }
                    messageArray.push([{
                        timestamp: message.timestamp,
                        isDate: true
                    }]);
                }
                if (userClub.club.messages.length > 0) {
                    if (currentUser != message.author._id) {
                        if (userMessageArray.length > 0) {
                            messageArray.push(userMessageArray);
                        }
                        userMessageArray = [];
                        currentUser = message.author._id;
                        userMessageArray.push({
                            authorId: message.author._id,
                            authorName: message.authorName,
                            authorPicture: message.author.profilePicture,
                            timestamp: message.timestamp,
                            body: message.body,
                            isSelf: (message.author._id.equals(userId) ? true : false),
                            isDate: false
                        });
                    } else {
                        userMessageArray.push({
                            authorId: message.author._id,
                            authorName: message.authorName,
                            authorPicture: message.author.profilePicture,
                            timestamp: message.timestamp,
                            body: message.body,
                            isSelf: (message.author._id.equals(userId) ? true : false),
                            isDate: false
                        });
                    }
                }
            });
            messageArray.push(userMessageArray);
        }

        res.status(200).json({
            clubId: userClub.club._id,
            clubName: userClub.club.name,
            clubLogo: userClub.club.logo,
            messages: messageArray,
            role: userClub.role2
        });
        return;

    } catch (err) {
        res.status(500).json({
            error: err
        });
        return;
    } //
};