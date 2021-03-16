// TODO:
// 1) approve club creations requests
// 2) deny club creations requests
// 3) approve requests to join clubs
// 4) deny requests to join clubs
// 5) GET all requests

import { Request, Response } from "express";
import Club from "@models/Club";
import User from "@models/User";
import logger from "@logger";
import { APP_ROLE } from "@models/enums";

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