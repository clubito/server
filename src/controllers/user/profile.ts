import { Request, Response } from "express";
import User from "@models/User";
import logger from "@logger";
import joi from "joi";

const putUserProfileSchema = joi.object().keys({
    email: joi.string().email().regex(/@purdue.edu$/i),
    name: joi.string(),
    profilePicture: joi.string().uri()
});

interface IReturnedUserProfile {
    name: string,
    email: string,
    clubs: {
        name: string,
        description: string,
        logo: string,
        role: string
    }[],
    joinRequests: {
        name: string,
        description: string,
        logo: string
        status: string
    }[],
    tags: string[]
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
            const ret: IReturnedUserProfile = {
                name: user.name,
                email: user.email,
                clubs: [],
                joinRequests: [],
                tags: user.clubTags
            };
            user.clubs.forEach(club => {
                ret.clubs.push({
                    name: club.club.name,
                    description: club.club.description,
                    logo: club.club.logo,
                    role: club.role
                });
            });
            user.joinRequests.forEach(joinRequest => {
                ret.joinRequests.push({
                    name: joinRequest.club.name,
                    description: joinRequest.club.description,
                    logo: joinRequest.club.logo,
                    status: joinRequest.status
                });
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

            const { email, name, profilePicture } = req.body;

            if (email) {
                user.email = email;
            }
            if (name) {
                user.name = name;
            }
            if (profilePicture) {
                user.profilePicture = profilePicture;
            }
            user.save()
                .then(() => {
                    res.status(200).json({ "message": "Successfully updated user profile" });
                });
        })
        .catch(err => {
            logger.error(err);
            res.status(500).json({ error: err });
            return;
        });
};