import { Request, Response } from "express";
import Club from "@models/Club";
import User from "@models/User";
import logger from "@logger";
import joi from "joi";
import { CLUB_ROLE, JOIN_REQUEST_STATUS } from "@models/enums";

const getClubProfileSchema = joi.object().keys({
    id: joi.required()
});

interface IReturnedClubProfile {
    name: string,
    logo: string,
    description: string,
    id: string,
    members: {
        id: string,
        name: string,
        role: {
            name: string,
            permissions: string[]
        },
        profilePicture: string,
        approvalDate: Date
    }[],
    tags: string[],
    announcements: {
        message: string,
        timestamp: Date
    }[],
    events: {
        name: string,
        description: string,
        startTime: Date,
        endTime: Date,
        longitude: number,
        latitude: number,
        shortLocation: string,
        picture: string,
        lastUpdated: Date
    }[],
    role: {
        name: string,
        permissions: string[]
    },
    joinRequests?: {
        id: string,
        name: string,
        profilePicture: string
    }[],
    joinRequestStatus: {
        status: string,
        approvalDate: Date
    }
}

export const getClubProfile = (req: Request, res: Response): void => {
    const { error } = getClubProfileSchema.validate(req.query);
    if (error) {
        res.status(400).json({ "error": error.message });
        logger.debug(error);
        return;
    }

    const { id } = req.query;

    const userId = req.userId;

    Club.findOne({ _id: id, "deleted.isDeleted": false })
        .populate({
            path: "members",
            populate: { path: "member" }
        })
        .populate("events")
        .populate("announcements")
        .then(club => {
            if (!club) {
                res.status(400).json({ error: "Club not found" });
                return;
            }

            User.findOne({ _id: userId })
                .then(user => {
                    if (!user) {
                        res.status(400).json({ error: "User not found" });
                        return;
                    }

                    let userClubRole;
                    let userJoinRequest = "NOT REQUESTED";
                    let approvalDate = new Date("2001-09-11");

                    user.clubs.forEach(userClub => {
                        if (userClub.club._id.equals(club._id)) {
                            userClubRole = {
                                name: userClub.role2.name,
                                permissions: userClub.role2.permissions
                            };
                            userJoinRequest = JOIN_REQUEST_STATUS.ACCEPTED; // user is already in the club
                            approvalDate = userClub.approvalDate;
                        }
                    });

                    if (userClubRole === undefined) {
                        userClubRole = {
                            name: "Non-Member",
                            permissions: []
                        };
                    }

                    user.joinRequests.forEach(joinRequest => {
                        if (joinRequest.club.equals(club._id)) {
                            userJoinRequest = joinRequest.status;
                        }
                    });

                    const returnedProfile: IReturnedClubProfile = {
                        name: club.name,
                        logo: club.logo,
                        description: club.description,
                        id: club._id,
                        members: [],
                        announcements: [],
                        events: [],
                        role: userClubRole,
                        tags: club.tags,
                        joinRequestStatus: {
                            status: userJoinRequest,
                            approvalDate: approvalDate
                        }
                    };

                    club.members.forEach(member => {
                        // logger.fatal();
                        const approvalDate = member.member.clubs.find(club => club.club.equals(id)).approvalDate;
                        returnedProfile.members.push({
                            id: member.member._id,
                            name: member.member.name,
                            profilePicture: member.member.profilePicture,
                            role: member.role2,
                            approvalDate
                        });
                    });

                    club.announcements.forEach(announcement => {
                        returnedProfile.announcements.push({
                            message: announcement.message,
                            timestamp: announcement.timestamp
                        });
                    });

                    club.events.forEach(event => {
                        const currEvent = {
                            name: event.name,
                            description: event.description,
                            startTime: event.startTime,
                            endTime: event.endTime,
                            longitude: event.longitude,
                            latitude: event.latitude,
                            shortLocation: event.shortLocation,
                            picture: event.picture,
                            lastUpdated: event.lastUpdated,
                            id: event._id
                        };
                        returnedProfile.events.push(currEvent);
                    });

                    res.status(200).json(returnedProfile);
                    return;
                });

        })
        .catch(err => {
            logger.error(err);
            res.status(500).json({ error: err });
            return;
        });
};


// export const putUserProfile = (req: Request, res: Response): void => {
//     const { error } = putUserProfileSchema.validate(req.body);
//     if (error) {
//         res.status(400).json({ "error": error.message });
//         logger.debug(error);
//         return;
//     }

//     const userId = req.userId;

//     User.findOne({ _id: userId })
//         .populate({
//             path: "clubs",
//             populate: { path: "club" }
//         })
//         .populate({
//             path: "joinRequests",
//             populate: { path: "club" }
//         })
//         .then(user => {
//             if (!user) {
//                 res.status(400).json({ error: "User not found" });
//                 return;
//             }

//             const { email, name, profilePicture } = req.body;

//             if (email) {
//                 user.email = email;
//             }
//             if (name) {
//                 user.name = name;
//             }
//             if (profilePicture) {
//                 user.profilePicture = profilePicture;
//             }
//             user.save()
//                 .then(() => {
//                     res.status(200).json({ "message": "Successfully updated user profile" });
//                 });
//         })
//         .catch(err => {
//             logger.error(err);
//             res.status(500).json({ error: err });
//             return;
//         });
// };