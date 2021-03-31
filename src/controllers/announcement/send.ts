import { Request, Response } from "express";
import Club from "@models/Club";
import User from "@models/User";
import logger from "@logger";
import joi from "joi";
import { CLUB_ROLE } from "@models/enums";
import { sendClubAnnouncementNotification } from "@notifications";
import Announcement from "@models/Announcement";
import { ObjectId } from "mongodb";

const postSendAnnouncementSchema = joi.object().keys({
    clubId: joi.string().custom((value, helper) => {
        if (ObjectId.isValid(value)) {
            return value;
        } else {
            return helper.message({ custom: "id is not valid" });
        }
    }).required(),
    message: joi.string().required()
});


export const postSendAnnouncement = (req: Request, res: Response): void => {
    const { error } = postSendAnnouncementSchema.validate(req.body);

    if (error) {
        res.status(400).json({ "error": error.message });
        logger.debug(error);
        return;
    }

    const { clubId, message } = req.body;
    const userId = req.userId;

    Club.findOne({ _id: clubId, "deleted.isDeleted": false })
        .then(club => {
            if (!club) {
                res.status(400).json({ error: "Club not found" });
                return;
            }
            User.findOne({ _id: userId })
                .then(async user => {
                    if (!user) {
                        res.status(400).json({ error: "User not found" });
                        return;
                    }

                    if (!user.clubs.some(userClub => userClub.club.equals(clubId))) {
                        // Is not part of this club
                        res.status(400).json({ error: "Current user does not have permission to do that." });
                        return;
                    }

                    const currUserRole = (user.clubs as any[]).find(userClub => { return userClub.club.equals(clubId); }).role;
                    if (currUserRole === CLUB_ROLE.MEMBER || currUserRole === CLUB_ROLE.NONMEMBER) {
                        res.status(400).json({ error: "Current user does not have permission to do that." });
                        return;
                    }

                    const newAnnouncement = new Announcement({
                        club: club._id,
                        message
                    });

                    club.announcements.push(newAnnouncement._id);

                    try {
                        await club.save();
                        await newAnnouncement.save();
                        await sendClubAnnouncementNotification(club._id, club.name, currUserRole, message);

                        res.status(200).json({ message: "Successfully created announcement" });
                        return;
                    } catch (err) {
                        throw err;
                    }
                })
                .catch(e => {
                    throw e;
                });
        })
        .catch(err => {
            logger.error(err);
            res.status(500).json({ error: err });
            return;
        });
};