// All routes related to the owner goes in here
// Requesting clubs, deleting clubs, etc.
import { Request, Response } from "express";
import Club from "@models/Club";
import User from "@models/User";
import logger from "@logger";
import joi from "joi";
import { CLUB_ROLE } from "@models/enums";
import Role from "@models/Role";

const postRequestClubSchema = joi.object().keys({
    name: joi.string().min(3).required(),
    description: joi.string().min(20).required(),
    tags: joi.array().items(joi.string()).required(),
    logo: joi.string().uri().optional()
});

export const postRequestClub = (req: Request, res: Response): void => {
    const { error } = postRequestClubSchema.validate(req.body);

    if (error) {
        res.status(400).json({ "error": error.message });
        logger.debug(error);
        return;
    }

    const { name, description, tags, logo } = req.body;
    const userId = req.userId;

    User.findById(userId)
        .then(user => {
            if (!user) {
                res.status(400).json({ error: "User not found" });
                return;
            }

            Club.findOne({ name, "deleted.isDeleted": false }).then(club => {
                if (club) {
                    res.status(400).json({ error: "Club with that name already exists" });
                    return;
                }

                Role.findOne({ name: "President" }).then(ownerRole => {
                    const newClub = new Club({
                        name,
                        description,
                        tags,
                        logo,
                        members: [{ member: userId, role: CLUB_ROLE.OWNER, role2: ownerRole }]
                    });

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    newClub.save((err: any, createdClub) => {
                        if (err || !createdClub) {
                            if (err.code == 11000) {
                                res.status(400).json({ "error": "Club with that name already exists" });
                                logger.debug({ "error": "Tried adding club with existing name", name });
                            } else {
                                res.status(400).json({ "error": "Error requesting club creation: " + err?.message });
                                logger.error(err?.message || `Cannot request to create club with name: ${name}`);
                            }
                            return;

                        }

                        res.status(200).json({
                            "message": "Successfully requested to create club",
                            "id": newClub["_id"]
                        });

                        return;
                    });
                });
            });
        })
        .catch(err => {
            logger.error(err);
            res.status(500).json({ error: err });
            return;
        });
};