
import { Request, Response } from "express";
import joi from "joi";
import logger from "@logger";
import { ObjectId } from "bson";
import User from "@models/User";
import Club from "@models/Club";

const deleteClubSchema = joi.object().keys({
    id: joi.string().custom((value, helper) => {
        if (ObjectId.isValid(value)) {
            return value;
        } else {
            return helper.message({ custom: "id is not valid" });
        }
    }).required()
});

export const deleteClub = async (req: Request, res: Response) => {
    const { error } = deleteClubSchema.validate(req.query); // same schema so reusing here, dont @ me

    if (error) {
        res.status(400).json({ "error": error.message });
        logger.debug(error);
        return;
    }

    const clubId = req.query.id;
    const userId = req.userId;

    try {
        //TODO: check for user permission
        // const currUser = await User.findById(userId).exec();

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

        res.status(200).json({ message: "Successfully deleted club" });
        return;
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: err });
        return;
    }
};