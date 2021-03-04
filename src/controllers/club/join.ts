import { Request, Response } from "express";
import Club from "@models/Club";
import User from "@models/User";
import logger from "@logger";
import joi from "joi";
import { JOIN_REQUEST_STATUS } from "@models/enums";

const postClubJoinSchema = joi.object().keys({
    id: joi.required()
});

// interface IReturnedUserProfile {
//     name: string,
//     email: string,
//     clubs: {
//         name: string,
//         description: string,
//         logo: string,
//         role: string
//     }[],
//     joinRequests: {
//         name: string,
//         description: string,
//         logo: string
//         status: string
//     }[],
//     tags: string[]
// }

export const postClubJoin = (req: Request, res: Response): void => {
    const { error } = postClubJoinSchema.validate(req.body); // makes sure id is specified

    if (error) {
        res.status(400).json({ "error": error.message });
        logger.debug(error);
        return;
    }

    const { id } = req.body;
    const userId = req.userId;

    Club.findOne({ _id: id })
        .then(club => {
            if (!club) {
                res.status(400).json({ error: "Club not found" });
                return;
            }
            User.findOne({ _id: userId })
                .then(user => {
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

                        club.joinRequests.push({ user: club._id, status: JOIN_REQUEST_STATUS.PENDING, requestedAt: new Date(Date.now()) });
                        user.joinRequests.push({ club: club._id, status: JOIN_REQUEST_STATUS.PENDING, requestedAt: new Date(Date.now()) });

                        club.save();
                        user.save();

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