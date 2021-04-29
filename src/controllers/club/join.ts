/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";
import Club from "@models/Club";
import User from "@models/User";
import logger from "@logger";
import joi from "joi";
import { CLUB_ROLE, JOIN_REQUEST_STATUS } from "@models/enums";
import { sendJrApprovedNotificationToUser, sendKickedNotificationToUser, sendJrDeniedNotificationToUser } from "@notifications";
import Role from "@models/Role";

const postClubJoinSchema = joi.object().keys({
    id: joi.required()
});

const postClubApproveSchema = joi.object().keys({
    userId: joi.string().required(),
    clubId: joi.string().required()
});

const getAllJoinRequestsSchema = joi.object().keys({
    id: joi.string().required()
});

const postClubKickSchema = joi.object().keys({
    userId: joi.string().required(),
    clubId: joi.string().required(),
    reason: joi.string().required()
});

interface IReturnedUserProfile {
    name: string,
    id: string,
    profilePicture: string,
    bio: string,
    status: string,
    requestedAt: Date
}

export const postClubJoin = (req: Request, res: Response): void => {
    const { error } = postClubJoinSchema.validate(req.body); // makes sure id is specified

    if (error) {
        res.status(400).json({ "error": error.message });
        logger.debug(error);
        return;
    }

    const { id } = req.body;
    const userId = req.userId;

    Club.findOne({ _id: id, "deleted.isDeleted": false })
        .then(club => {
            if (!club) {
                res.status(400).json({ error: "Club not found" });
                return;
            }
            User.findOne({ _id: userId })
                .then(async user => {
                    if (user) {
                        // the as any[] is a workaround for a TS bug. probably will get fixed soon
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const isMember = (user.clubs as any[]).find(userClub => {
                            return userClub.club.equals(club._id);
                        });

                        if (isMember) {
                            res.status(400).json({ error: "User is already a member" });
                            return;
                        }

                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const hasRequested: boolean = (user.joinRequests as any[]).find(joinRequest => {
                            return joinRequest.club.equals(club._id) && joinRequest.status === JOIN_REQUEST_STATUS.PENDING;
                        });

                        if (hasRequested) {
                            res.status(400).json({ error: "User has already requested to join this club" });
                            return;
                        }

                        club.joinRequests.push({ user: user._id, status: JOIN_REQUEST_STATUS.PENDING, requestedAt: new Date(Date.now()) });
                        user.joinRequests.push({ club: club._id, status: JOIN_REQUEST_STATUS.PENDING, requestedAt: new Date(Date.now()) });

                        await club.save();
                        await user.save();

                        res.status(200).json({ message: "Successfully requested to join club", club: { id: club._id } });
                        return;
                    } else {
                        res.status(500).json({ error: "User not found" });
                        return;
                    }
                });
        })
        .catch(err => {
            logger.error(err);
            res.status(500).json({ error: err });
            return;
        });
};

export const postClubApprove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { error } = postClubApproveSchema.validate(req.body); // make sure cludId and userId are specified

    if (error) {
        res.status(400).json({ "error": error.message });
        logger.debug(error);
        return;
    }

    try {
        const { clubId, userId } = req.body;
        const currUserId = req.userId;

        const currUser = await User.findById(currUserId).exec();
        const currClub = await Club.findById(clubId).exec();
        const unapprovedUser = await User.findById(userId)
            .populate({
                path: "clubs",
                populate: { path: "club" }
            })
            .populate({
                path: "joinRequests",
                populate: { path: "club" }
            }).exec();

        if (!currUser || !unapprovedUser) {
            res.status(400).json({ error: "User does not exist" });
            return;
        }
        if (!currClub) {
            res.status(400).json({ error: "Club does not exist" });
            return;
        }

        /*
        Flow for approving user join request
        1) Make sure the currUser has the appropriate permissions (OFFICER or OWNER)
        2) Make sure the unapprovedUser has the club in their join requests
        3) Make sure the unapprovedUser is not already a member
        4) Remove the user from both the join requests
        5) Add the user to the clubs members and the club to the users club
        */

        // Step 1
        currUser.clubs.forEach(club => {
            if (club.club.equals(clubId)) {
                if (club.role != CLUB_ROLE.OFFICER && club.role != CLUB_ROLE.OWNER) {
                    res.status(400).json({ error: "Current user does not have permission to do that." });
                    return;
                }
            }
        });

        // Step 2
        if (!unapprovedUser.joinRequests.some(joinRequest => joinRequest.club.equals(clubId))) {
            // User does not have this club in their joinRequests
            res.status(400).json({ error: "Given user has not requested to join this club" });
            return;
        }

        // Step 3
        if (unapprovedUser.clubs.some(club => club.club.equals(clubId))) {
            // User is already a part of this club
            res.status(400).json({ error: "Given user is already a part of the club" });
            return;
        }

        // Step 4
        unapprovedUser.joinRequests = (unapprovedUser.joinRequests as any[]).filter(joinRequest => { return !joinRequest.club.equals(clubId); });
        currClub.joinRequests = (currClub.joinRequests as any[]).filter(user => { return !user.user.equals(unapprovedUser._id); });

        // Step 5
        const memberRole = await Role.findOne({ name: "Member" }).exec();
        if (!memberRole) {
            res.status(400).json({ error: "An error has occured, please try again" });
            return;
        }
        currClub.members.push({ member: unapprovedUser._id, role: CLUB_ROLE.MEMBER, role2: memberRole._id });
        unapprovedUser.clubs.push({ club: clubId, role: CLUB_ROLE.MEMBER, approvalDate: new Date(Date.now()), role2: memberRole._id });
        await currClub.save();
        await unapprovedUser.save();

        await sendJrApprovedNotificationToUser(unapprovedUser._id, currClub._id, currClub.name);
        res.status(200).json({ message: "Successfully approved join request" });
        return;
    } catch (err) {
        return next(err);
    }
};

export const postClubDeny = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { error } = postClubApproveSchema.validate(req.body); // same schema as postclubapprove

    if (error) {
        res.status(400).json({ "error": error.message });
        logger.debug(error);
        return;
    }

    try {
        const { clubId, userId } = req.body;
        const currUserId = req.userId;

        const currUser = await User.findById(currUserId).exec();
        const currClub = await Club.findById(clubId).exec();
        const unapprovedUser = await User.findById(userId)
            .populate({
                path: "clubs",
                populate: { path: "club" }
            })
            .populate({
                path: "joinRequests",
                populate: { path: "club" }
            }).exec();

        if (!currUser || !unapprovedUser) {
            res.status(400).json({ error: "User does not exist" });
            return;
        }
        if (!currClub) {
            res.status(400).json({ error: "Club does not exist" });
            return;
        }

        currUser.clubs.forEach(club => {
            if (club.club.equals(clubId)) {
                if (club.role != CLUB_ROLE.OFFICER && club.role != CLUB_ROLE.OWNER) {
                    res.status(400).json({ error: "Current user does not have permission to do that." });
                    return;
                }
            }
        });

        if (!unapprovedUser.joinRequests.some(joinRequest => joinRequest.club.equals(clubId))) {
            // User does not have this club in their joinRequests
            res.status(400).json({ error: "Given user has not requested to join this club" });
            return;
        }

        if (unapprovedUser.clubs.some(club => club.club.equals(clubId))) {
            // User is already a part of this club
            res.status(400).json({ error: "Given user is already a part of the club" });
            return;
        }

        unapprovedUser.joinRequests = (unapprovedUser.joinRequests as any[]).filter(joinRequest => { return !joinRequest.club.equals(clubId); });
        currClub.joinRequests = (currClub.joinRequests as any[]).filter(user => { return !user.user.equals(unapprovedUser._id); });

        await currClub.save();
        await unapprovedUser.save();

        await sendJrDeniedNotificationToUser(unapprovedUser._id, currClub._id, currClub.name);
        res.status(200).json({ message: "Successfully denied join request" });
        return;
    } catch (err) {
        return next(err);
    }
};

export const getAllJoinRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { error } = getAllJoinRequestsSchema.validate(req.query); // make sure cludId and userId are specified

    if (error) {
        res.status(400).json({ "error": error.message });
        logger.debug(error);
        return;
    }

    try {
        const clubId = req.query.id;
        const currUserId = req.userId;

        const currUser = await User.findById(currUserId).exec();
        const currClub = await Club.findById(clubId)
            .populate({
                path: "joinRequests",
                populate: { path: "user" }
            }).exec();

        if (!currUser) {
            res.status(400).json({ error: "User does not exist" });
            return;
        }
        if (!currClub) {
            res.status(400).json({ error: "Club does not exist" });
            return;
        }

        currUser.clubs.forEach(club => {
            if (club.club.equals(clubId)) {
                if (club.role != CLUB_ROLE.OFFICER && club.role != CLUB_ROLE.OWNER) {
                    res.status(400).json({ error: "Current user does not have permission to do that." });
                    return;
                }
            }
        });

        const returnedUsers: IReturnedUserProfile[] = [];

        currClub.joinRequests.forEach(joinRequest => {
            returnedUsers.push({
                bio: joinRequest.user.bio,
                id: joinRequest.user._id,
                name: joinRequest.user.name,
                profilePicture: joinRequest.user.profilePicture,
                status: joinRequest.status,
                requestedAt: joinRequest.requestedAt
            });
        });

        res.status(200).send(returnedUsers);
        return;
    } catch (err) {
        return next(err);
    }
};


export const postClubKick = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { error } = postClubKickSchema.validate(req.body);

    if (error) {
        res.status(400).json({ "error": error.message });
        logger.debug(error);
        return;
    }

    try {
        const { clubId, userId, reason } = req.body;
        const currUserId = req.userId;

        const currUser = await User.findById(currUserId).exec();
        const currClub = await Club.findById(clubId).exec();
        const kickedUser = await User.findById(userId)
            .populate({
                path: "clubs",
                populate: { path: "club" }
            })
            .populate({
                path: "joinRequests",
                populate: { path: "club" }
            }).exec();

        if (!currUser || !kickedUser) {
            res.status(400).json({ error: "User does not exist" });
            return;
        }
        if (!currClub) {
            res.status(400).json({ error: "Club does not exist" });
            return;
        }

        if (!kickedUser.clubs.some(club => club.club.equals(clubId))) {
            res.status(400).json({ error: "Given user is not a part of this club" });
            return;
        }

        // Makes sure the current user has permissions
        const kickedUserRole = (kickedUser.clubs as any[]).find(club => { return club.club.equals(clubId); }).role;
        const currUserRole = (currUser.clubs as any[]).find(club => { return club.club.equals(clubId); }).role;
        if (kickedUserRole === CLUB_ROLE.OWNER) {
            res.status(400).json({ error: "Cannot kick club owner" });
            return;
        }
        if (currUserRole != CLUB_ROLE.OWNER) {
            // Not the owner
            res.status(400).json({ error: "Only owners can kick members, work your way up the ladder buddy" });
            return;
        }

        if (kickedUser.joinRequests.some(joinRequest => joinRequest.club.equals(clubId))) {
            // User has requested to join this club, remove it
            // Just a precautionary measure, shouldn't ever be here really
            kickedUser.joinRequests = (kickedUser.joinRequests as any[]).filter(joinRequest => { return !joinRequest.club.equals(clubId); });
            currClub.joinRequests = (currClub.joinRequests as any[]).filter(user => { return !user.user.equals(kickedUser._id); });
        }

        // remove the user from member list and vice versa
        kickedUser.clubs = (kickedUser.clubs as any[]).filter(club => { return !club.club.equals(clubId); });
        currClub.members = (currClub.members as any[]).filter(user => { return !user.member.equals(kickedUser._id); });

        await currClub.save();
        await kickedUser.save();

        await sendKickedNotificationToUser(kickedUser._id, currClub._id, currClub.name, kickedUserRole, reason);
        res.status(200).json({ message: "Successfully kicked user" });
        return;
    } catch (err) {
        return next(err);
    }
};