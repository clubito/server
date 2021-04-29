/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";
import User from "@models/User";
import Club from "@models/Club";
import logger from "@logger";
import joi from "joi";
import { CLUB_TAGS } from "@models/enums";

const putUserProfileSchema = joi.object().keys({
    email: joi.string().email().regex(/@purdue.edu$/i),
    name: joi.string(),
    profilePicture: joi.string().uri(),
    tags: joi.array().items(joi.string()),
    bio: joi.string()
});

const getAnotherUserProfileSchema = joi.object().keys({
    id: joi.string().required()
});

interface IReturnedUserProfile {
    name: string,
    email: string,
    id: string,
    profilePicture: string,
    clubs: {
        name: string,
        description: string,
        logo: string,
        role: {
            name: string,
            permissions: string[]
        },
        id: string
    }[],
    joinRequests: {
        name: string,
        description: string,
        logo: string,
        status: string,
        id: string
    }[],
    tags: string[],
    joinDate: Date,
    bio: string,
    settings: {
        notifications: {
            enabled: boolean
        }
    }
}

interface IReturnedAnotherUserProfile {
    name: string,
    email: string,
    id: string,
    profilePicture: string,
    clubs: {
        name: string,
        description: string,
        logo: string,
        role: {
            name: string,
            permissions: string[]
        },
        id: string
    }[],
    joinRequests: {
        name: string,
        description: string,
        logo: string,
        status: string,
        id: string
    }[],
    tags: string[],
    joinDate: Date,
    bio: string
}

export const getUserProfile = (req: Request, res: Response): void => {
    const userId = req.userId;

    User.findOne({ _id: userId })
        .populate({
            path: "clubs",
            populate: { path: "club" }
        })
        .populate({
            path: "joinRequests",
            populate: { path: "club" }
        })
        .then(user => {
            if (!user) {
                res.status(400).json({ error: "User not found" });
                return;
            }

            const userClubTags = Object.values(user.clubTags);

            const properCaseUserClubTags = userClubTags.map(tag => {
                return tag.toLowerCase()
                    .split(" ")
                    .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
                    .join(" ");
            });

            const ret: IReturnedUserProfile = {
                id: user._id,
                name: user.name,
                email: user.email,
                clubs: [],
                joinRequests: [],
                tags: properCaseUserClubTags,
                profilePicture: user.profilePicture,
                joinDate: user._id.getTimestamp(),
                bio: user.bio,
                settings: {
                    notifications: {
                        enabled: user.settings.notifications.enabled
                    }
                }
            };
            user.clubs.forEach(club => {
                if (!club.club.deleted.isDeleted) {
                    ret.clubs.push({
                        name: club.club.name,
                        description: club.club.description,
                        logo: club.club.logo,
                        role: club.role2,
                        id: club.club._id
                    });
                }
            });
            user.joinRequests.forEach(joinRequest => {
                if (!joinRequest.club.deleted.isDeleted) {
                    ret.joinRequests.push({
                        name: joinRequest.club.name,
                        description: joinRequest.club.description,
                        logo: joinRequest.club.logo,
                        status: joinRequest.status,
                        id: joinRequest.club._id
                    });
                }
            });
            res.status(200).json(ret);
            return;
        })
        .catch(err => {
            logger.error(err);
            res.status(500).json({ error: err });
            return;
        });
};


export const putUserProfile = (req: Request, res: Response): void => {
    const { error } = putUserProfileSchema.validate(req.body);
    if (error) {
        res.status(400).json({ "error": error.message });
        logger.debug(error);
        return;
    }

    const userId = req.userId;

    User.findOne({ _id: userId })
        .populate({
            path: "clubs",
            populate: { path: "club" }
        })
        .populate({
            path: "joinRequests",
            populate: { path: "club" }
        })
        .then(user => {
            if (!user) {
                res.status(400).json({ error: "User not found" });
                return;
            }

            const { email, name, profilePicture, tags, bio } = req.body;

            if (email) {
                user.email = email;
            }
            if (name) {
                user.name = name;
            }
            if (profilePicture) {
                user.profilePicture = profilePicture;
            }
            if (bio) {
                user.bio = bio;
            }

            const wrongTags: string[] = [];
            const correctTags: string[] = [];

            if (tags) {
                tags.forEach((tag) => {
                    if (Object.values(CLUB_TAGS).includes(tag.toUpperCase())) {
                        correctTags.push(tag.toUpperCase());
                    } else {
                        wrongTags.push(tag);
                    }
                });
            }

            if (wrongTags.length > 0) {
                res.status(400).json({ error: "The following tags do not exist", tags: wrongTags });
                return;
            }

            user.clubTags = correctTags;

            user.save()
                .then(() => {
                    res.status(200).json({ "message": "Successfully updated user profile" });
                    return;
                });
        })
        .catch(err => {
            logger.error(err);
            res.status(500).json({ error: err });
            return;
        });
};

export const deleteUserProfile = (req: Request, res: Response): void => {
    const userId = req.userId;

    User.findOne({ _id: userId })
        .populate({
            path: "clubs",
            populate: { path: "club" }
        })
        .populate({
            path: "joinRequests",
            populate: { path: "club" }
        })
        .then(user => {
            if (!user) {
                res.status(400).json({ error: "User not found" });
                return;
            }
            user.clubs.forEach(userClub => {
                Club.findOne({ _id: userClub.club._id })
                    .then(club => {
                        if (club) {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            club.members = (club?.members as any[]).filter(item => { return !item.member.equals(user._id); });
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            club.joinRequests = (club?.joinRequests as any[]).filter(item => { return !item.user.equals(user._id); });
                            club.save();
                        }
                    });
            });
            user.delete().exec();
            res.status(200).json({ message: "Successfully deleted user" });
            return;
        })
        .catch(err => {
            logger.error(err);
            res.status(500).json({ error: err });
            return;
        });
};

export const getAnotherUserProfile = (req: Request, res: Response): void => {
    const { error } = getAnotherUserProfileSchema.validate(req.query);
    if (error) {
        res.status(400).json({ "error": error.message });
        logger.debug(error);
        return;
    }

    const otherUserId = req.query.id;

    User.findOne({ _id: otherUserId })
        .populate({
            path: "clubs",
            populate: { path: "club" }
        })
        .then(user => {
            if (!user) {
                res.status(400).json({ error: "User not found" });
                return;
            }

            const userClubTags = Object.values(user.clubTags);

            const properCaseUserClubTags = userClubTags.map(tag => {
                return tag.toLowerCase()
                    .split(" ")
                    .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
                    .join(" ");
            });

            const ret: IReturnedAnotherUserProfile = {
                id: user._id,
                name: user.name,
                email: user.email,
                clubs: [],
                joinRequests: [],
                tags: properCaseUserClubTags,
                profilePicture: user.profilePicture,
                joinDate: user._id.getTimestamp(),
                bio: user.bio
            };
            user.clubs.forEach(club => {
                if (!club.club.deleted.isDeleted) {
                    ret.clubs.push({
                        name: club.club.name,
                        description: club.club.description,
                        logo: club.club.logo,
                        role: club.role2,
                        id: club.club._id
                    });
                }
            });
            res.status(200).json(ret);
            return;
        }).catch(err => {
            logger.error(err);
            res.status(500).json({ error: err });
            return;
        });

};

export const getUsersEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.userId;

    try {
        const user = await User
            .findById(userId)
            .populate({
                path: "clubs",
                populate: { path: "club", populate: { path: "events" } }
            })
            .exec();

        const ret: any[] = [];

        user?.clubs.forEach(club => {
            club.club.events.forEach(event => {
                ret.push({
                    name: event.name,
                    description: event.description,
                    startTime: event.startTime,
                    endTime: event.endTime,
                    longitude: event.longitude,
                    latitude: event.latitude,
                    shortLocation: event.shortLocation,
                    picture: event.picture,
                    clubId: event.club,
                    clubName: club.club.name,
                    lastUpdated: event.lastUpdated,
                    id: event._id
                });
            });
        });

        res.status(200).send(ret);
        return;
    } catch (err) {
        return next(err);
    }
};

export const getUsersRsvps = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.userId;

    try {
        const user = await User
            .findById(userId)
            .populate({
                path: "allRSVP",
                populate: { path: "club" }
            })
            .exec();

        const ret: any[] = [];

        user?.allRSVP.forEach(event => {
            ret.push({
                name: event.name,
                description: event.description,
                startTime: event.startTime,
                endTime: event.endTime,
                longitude: event.longitude,
                latitude: event.latitude,
                shortLocation: event.shortLocation,
                picture: event.picture,
                lastUpdated: event.lastUpdated,
                id: event._id,
                clubId: event.club._id,
                clubName: event.club.name,
            });
        });

        res.status(200).send(ret);
        return;
    } catch (err) {
        return next(err);
    }
};