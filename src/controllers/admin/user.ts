import { NextFunction, Request, Response } from "express";
import User from "@models/User";
import Club from "@models/Club";
import joi from "joi";
import logger from "@logger";
import { APP_ROLE } from "@models/enums";
import { ObjectId } from "bson";
import { sendBannedNotificationToUser } from "@notifications";


const deleteUserSchema = joi.object().keys({
    id: joi.string().custom((value, helper) => {
        if (ObjectId.isValid(value)) {
            return value;
        } else {
            return helper.message({ custom: "id is not valid" });
        }
    }).required()
});

export const getAllUsers = (req: Request, res: Response): void => {
    const userId = req.userId;

    User.findById(userId)
        .then(user => {
            if (user?.appRole != APP_ROLE.ADMIN) {
                // the current user is not an admin
                res.status(403).json({ error: "Please use an admin account" });
                return;
            }

            User.find({})
                .populate({
                    path: "clubs.club"
                })
                .populate({
                    path: "joinRequests.club"
                })
                .then(users => {
                    res.send(users);
                    return;
                });
        })
        .catch(err => {
            logger.error(err);
            res.status(500).json({ error: err });
            return;
        });
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { error } = deleteUserSchema.validate(req.body);

    if (error) {
        res.status(400).json({ "error": error.message });
        logger.debug(error);
        return;
    }

    const deletedUserId = req.body.id;
    const userId = req.userId;

    try {
        const currUser = await User.findById(userId).exec();
        if (currUser?.appRole != APP_ROLE.ADMIN) {
            // the current user is not an admin
            res.status(403).json({ error: "Please use an admin account" });
            return;
        }

        const user = await User.findById(deletedUserId)
            .populate({
                path: "clubs",
                populate: { path: "club" }
            })
            .populate({
                path: "joinRequests",
                populate: { path: "club" }
            }).exec();

        if (!user) {
            res.status(400).json({ error: "User not found" });
            return;
        }

        user.clubs.forEach(userClub => {
            Club.findOne({ _id: userClub.club._id })
                .then(async club => {
                    if (club) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        club.members = (club?.members as any[]).filter(item => { return !item.member.equals(user._id); });
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        club.joinRequests = (club?.joinRequests as any[]).filter(item => { return !item.user.equals(user._id); });
                        await club.save();
                    }
                });
        });

        user.joinRequests.forEach(userClub => {
            Club.findOne({ _id: userClub.club._id })
                .then(async club => {
                    if (club) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        club.members = (club?.members as any[]).filter(item => { return !item.member.equals(user._id); });
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        club.joinRequests = (club?.joinRequests as any[]).filter(item => { return !item.user.equals(user._id); });
                        await club.save();
                    }
                });
        });

        await user.delete();
        res.status(200).json({ message: "Successfully deleted user" });
        return;
    } catch (err) {
        return next(err);
    }
};


export const banUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { error } = deleteUserSchema.validate(req.body); // uses the same schema as delete user

    if (error) {
        res.status(400).json({ "error": error.message });
        logger.debug(error);
        return;
    }

    const bannedUserId = req.body.id;
    const userId = req.userId;

    try {
        const currUser = await User.findById(userId).exec();
        if (currUser?.appRole != APP_ROLE.ADMIN) {
            // the current user is not an admin
            res.status(403).json({ error: "Please use an admin account" });
            return;
        }

        const user = await User.findById(bannedUserId)
            .populate({
                path: "clubs",
                populate: { path: "club" }
            })
            .populate({
                path: "joinRequests",
                populate: { path: "club" }
            }).exec();

        if (!user) {
            res.status(400).json({ error: "User not found" });
            return;
        }

        // delete the user from all their clubs
        user.clubs.forEach(userClub => {
            Club.findOne({ _id: userClub.club._id })
                .then(async club => {
                    if (club) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        club.members = (club?.members as any[]).filter(item => { return !item.member.equals(user._id); });
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        club.joinRequests = (club?.joinRequests as any[]).filter(item => { return !item.user.equals(user._id); });
                        await club.save();
                    }
                });
        });

        user.joinRequests.forEach(userClub => {
            Club.findOne({ _id: userClub.club._id })
                .then(async club => {
                    if (club) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        club.members = (club?.members as any[]).filter(item => { return !item.member.equals(user._id); });
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        club.joinRequests = (club?.joinRequests as any[]).filter(item => { return !item.user.equals(user._id); });
                        await club.save();
                    }
                });
        });

        user.banned = true;
        user.pushToken = "";
        await user.save();
        await sendBannedNotificationToUser(user._id);
        res.status(200).json({ message: "Successfully banned user" });
        return;
    } catch (err) {
        return next(err);
    }
};

export const unbanUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { error } = deleteUserSchema.validate(req.body); // uses the same schema as delete user

    if (error) {
        res.status(400).json({ "error": error.message });
        logger.debug(error);
        return;
    }

    const unbannedUserId = req.body.id;
    const userId = req.userId;

    try {
        const currUser = await User.findById(userId).exec();
        if (currUser?.appRole != APP_ROLE.ADMIN) {
            // the current user is not an admin
            res.status(403).json({ error: "Please use an admin account" });
            return;
        }

        const user = await User.findById(unbannedUserId)
            .populate({
                path: "clubs",
                populate: { path: "club" }
            })
            .populate({
                path: "joinRequests",
                populate: { path: "club" }
            }).exec();

        if (!user) {
            res.status(400).json({ error: "User not found" });
            return;
        }

        // this user is deleted from all their clubs, so add them back
        user.clubs.forEach(userClub => {
            Club.findOne({ _id: userClub.club._id })
                .then(async club => {
                    if (club) {
                        club.members.push({
                            member: user._id,
                            role: userClub.role
                        });
                        await club.save();
                    }
                });
        });

        // also add back all their join requests
        user.joinRequests.forEach(userClub => {
            Club.findOne({ _id: userClub.club._id })
                .then(async club => {
                    if (club) {
                        club.joinRequests.push({
                            user: user._id,
                            status: userClub.status,
                            requestedAt: userClub.requestedAt
                        });
                        await club.save();
                    }
                });
        });

        user.banned = false;
        await user.save();
        res.status(200).json({ message: "Successfully unbanned user" });
        return;
    } catch (err) {
        return next(err);
    }
};