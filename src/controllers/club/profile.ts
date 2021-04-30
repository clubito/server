import { NextFunction, Request, Response } from "express";
import Club from "@models/Club";
import User from "@models/User";
import logger from "@logger";
import joi from "joi";
import { JOIN_REQUEST_STATUS } from "@models/enums";

const getClubProfileSchema = joi.object().keys({
    id: joi.required()
});

const addClubThemeSchema = joi.object().keys({
    id: joi.required(),
    theme: joi.required()
});

const postClubGallerySchema = joi.object().keys({
    id: joi.string().required(),
    pictures: joi.array().items(joi.string()).required(),
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
    },
    theme: string
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
                        },
                        theme: club.theme
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

export const editClubTheme = (req: Request, res: Response): void => {
    const { error } = addClubThemeSchema.validate(req.body);
    if (error) {
        res.status(400).json({ "error": error.message });
        logger.debug(error);
        return;
    }
    const { id, theme } = req.body;
    Club.findOne({ _id: id, "deleted.isDeleted": false }).then(async club => {
        if (!club) {
            res.status(400).json({ error: "Club not found" });
            return;
        }
        club.theme = theme;
        await club.save();

        res.status(200).json({
            message: "Successfully edit the club's theme"
        });
        return;

    }).catch(err => {
        logger.error(err);
        res.status(500).json({ error: err });
        return;
    });
};

export const postClubGallery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { error } = postClubGallerySchema.validate(req.body);
    if (error) {
        res.status(400).json({ "error": error.message });
        logger.debug(error);
        return;
    }

    try {
        const clubId = req.body.id;
        const newPictures = req.body.pictures;
        const club = await Club.findOne({ _id: clubId, "deleted.isDeleted": false }).exec();

        if (!club) {
            res.status(400).json({ error: "Club with that id not found" });
            return;
        }

        club.pictures = newPictures;
        await club.save();

        res.status(200).json({ message: "Successfully updated club's pictures" });
        return;
    } catch (err) {
        return next(err);
    }
};

export const getClubGallery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { error } = getClubProfileSchema.validate(req.query); // same schema, just want id
    if (error) {
        res.status(400).json({ "error": error.message });
        logger.debug(error);
        return;
    }

    try {
        const clubId = req.query.id;
        const club = await Club.findOne({ _id: clubId, "deleted.isDeleted": false }).exec();

        if (!club) {
            res.status(400).json({ error: "Club with that id not found" });
            return;
        }

        res.status(200).json({ pictures: club.pictures });
        return;
    } catch (err) {
        return next(err);
    }
};