import { Request, Response } from "express";
import User from "@models/User";
import logger from "@logger";

interface IReturnedUserProfile {
    name: string,
    email: string,
    clubs: {
        name: string,
        description: string,
        role: string
    }[],
    joinRequests: {
        name: string,
        description: string,
        status: string
    }[]
}

export const getUserProfile = (req: Request, res: Response): void => {
    const userId = req.userId;

    User.findOne({ _id: userId })
        .populate({
            path: "clubs",
            populate: { path: "club" }
        })
        .populate("joinRequests")
        .then(user => {
            if (!user) {
                res.status(400).json({ error: "User not found" });
                return;
            }
            const ret: IReturnedUserProfile = {
                name: user.name,
                email: user.email,
                clubs: [],
                joinRequests: []
            };
            user.clubs.forEach(club => {
                ret.clubs.push({
                    name: club.club.name,
                    description: club.club.description,
                    role: club.role
                });
            });
            user.joinRequests.forEach(joinRequest => {
                ret.joinRequests.push({
                    name: joinRequest.club.name,
                    description: joinRequest.club.description,
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
    const userId = req.userId;

    User.findOne({ userId })
        .populate("clubs")
        .populate("joinRequests")
        .then(user => {
            if (!user) {
                res.status(400).json({ error: "User not found" });
            }
            res.status(200).json({ user: user });
            return;
        })
        .catch(err => {
            logger.error(err);
            res.status(500).json({ error: err });
            return;
        });

};