// TODO:
// 1) approve club creations requests
// 2) deny club creations requests
// 3) approve requests to join clubs
// 4) deny requests to join clubs
// 5) GET all requests

import { NextFunction, Request, Response } from "express";
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

const deleteClubSchema = joi.object().keys({
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

export const postApproveClubRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

        ownerUser.clubs.push({ club: club._id, role: CLUB_ROLE.OWNER, approvalDate: new Date(Date.now()) });
        await ownerUser.save();
        await club.save();
        res.status(200).json({ message: "Successfully approved club request 😎" });
        return;

    } catch (err) {
        return next(err);
    }
};

export const postDenyClubRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { error } = postApproveClubRequestSchema.validate(req.body); // same schema so reusing here

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
            res.status(400).json({ error: "Club is already approved, please delete using POST /clubs/delete instead" });
            return;
        }

        await club.delete();
        res.status(200).json({ message: "Successfully denied club request 😎" });
        return;
    } catch (err) {
        return next(err);
    }
};

export const deleteClub = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { error } = deleteClubSchema.validate(req.body); // same schema so reusing here, dont @ me

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

        if (club.deleted.isDeleted) {
            res.status(400).json({ error: "Club is already deleted" });
            return;
        }

        club.deleted.isDeleted = true;
        club.deleted.deletedAt = new Date(Date.now());
        await club.save();

        res.status(200).json({ message: "Successfully deleted club 😎" });
        return;
    } catch (err) {
        return next(err);
    }
};

export const undeleteClub = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { error } = deleteClubSchema.validate(req.body);

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

        if (!club.deleted.isDeleted) {
            res.status(400).json({ error: "Club is not deleted" });
            return;
        }

        club.deleted.isDeleted = false;
        club.deleted.deletedAt = null;
        await club.save();

        res.status(200).json({ message: "Successfully undeleted club 😎" });
        return;
    } catch (err) {
        return next(err);
    }
};

export const getAllClubs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.userId;

    try {
        const currUser = await User.findById(userId).exec();
        if (currUser?.appRole != APP_ROLE.ADMIN) {
            // the current user is not an admin
            res.status(403).json({ error: "Please use an admin account" });
            return;
        }

        const memberReturnFields = "name isConfirmed profilePicture banned email";
        const announcementReturnFields = "message createdAt";
        const eventReturnFields = "name description startTime endTime shortLocation";
        const allClubs = await Club.find({})
            .populate({ path: "members.member", select: memberReturnFields })
            .populate({ path: "announcements", select: announcementReturnFields, options: { sort: { "createdAt": -1 } }, perDocumentLimit: 1 })
            .populate({ path: "events", select: eventReturnFields, options: { sort: { "startTime": -1 } }, perDocumentLimit: 1 });

        res.send(allClubs);
        return;
    } catch (err) {
        return next(err);
    }
};