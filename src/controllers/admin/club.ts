// TODO:
// 1) approve club creations requests
// 2) deny club creations requests
// 3) approve requests to join clubs
// 4) deny requests to join clubs
// 5) GET all requests

import { Request, Response } from "express";
import Club from "@models/Club";
import User from "@models/User";
import joi from "joi";
import logger from "@logger";
import { APP_ROLE, CLUB_ROLE } from "@models/enums";
import { ObjectId } from "bson";


const postApproveClubRequestSchema = joi.object().keys({
    id: joi.string().custom((value, helper) => {
        if (ObjectId.isValid(value)) {
            return value;
        } else {
            return helper.message({ custom: "id is not valid" });
        }
    }).required()
});


export const getAllClubRequests = (req: Request, res: Response): void => {
    const userId = req.userId;

    User.findById(userId)
        .then(user => {
            if (user?.appRole != APP_ROLE.ADMIN) {
                // the current user is not an admin
                res.status(403).json({ error: "Please use an admin account" });
                return;
            }

            Club.find({ isEnabled: false }).then(clubs => {
                res.send(clubs);
                return;
            });
        })
        .catch(err => {
            logger.error(err);
            res.status(500).json({ error: err });
            return;
        });
};

export const postApproveClubRequest = async (req: Request, res: Response): Promise<void> => {
    const { error } = postApproveClubRequestSchema.validate(req.body);

    if (error) {
        res.status(400).json({ "error": error.message });
        logger.debug(error);
        return;
    }

    const clubId = req.body.id;
    const userId = req.userId;

    try {
        const currUser = await User.findById(userId).exec();
        if (currUser?.appRole != APP_ROLE.ADMIN) {
            // the current user is not an admin
            res.status(403).json({ error: "Please use an admin account" });
            return;
        }

        const club = await Club.findById(clubId).exec();

        if (!club) {
            res.status(400).json({ error: "Club not found" });
            return;
        }

        if (club.isEnabled) {
            res.status(400).json({ error: "Club is already approved" });
            return;
        }

        club.isEnabled = true;
        const ownerUserId = club.members[0]?.member;

        // When first requesting a club, the user's id is saved as the owner
        // but the user's club list doesn't contain it. So now add it since approved
        const ownerUser = await User.findById(ownerUserId).exec();

        if (!ownerUser) {
            res.status(500).json({ error: "A server-side error has occured. Please contact support." });
            logger.error("A requested club has no OWNER user.", club);
            return;
        }

        ownerUser.clubs.push({ club: club._id, role: CLUB_ROLE.OWNER });
        ownerUser.save();
        club.save();
        res.status(200).json({ message: "Successfully approved club request 😎" });
        return;

    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: err });
        return;
    }
};