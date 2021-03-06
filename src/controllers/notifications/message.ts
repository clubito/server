import { NextFunction, Request, Response } from "express";
import logger from "@logger";
import joi from "joi";
import { sendNotificationToClub, sendNotificationToUser } from "@notifications";
import { INotificationInterface } from "@models/Interfaces/INotificationInterface";
import Role from "@models/Role";

const postSendTestNotificationSchema = joi.object().keys({
    message: joi.string().required()
});

const postSendTestClubNotificationSchema = joi.object().keys({
    message: joi.string().required(),
    id: joi.string().required()
});

export const postSendTestNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { error } = postSendTestNotificationSchema.validate(req.body);

    if (error) {
        res.status(400).json({ "error": error.message });
        logger.debug(error);
        return;
    }
    try {
        const { message } = req.body;
        const userId = req.userId;

        if (!userId) {
            res.status(400).json({ error: "User not specified" });
            return;
        }

        const ownerRole = await Role.findOne({ name: "President" }).exec();

        const newNotification: INotificationInterface = {
            body: message ?? "Test notification",
            title: "Clubito Test Notification",
            data: {
                type: "event",
                id: "test id",
                role: ownerRole || undefined,
                title: "test title"
            }
        };

        const sent = await sendNotificationToUser(userId, newNotification);
        if (sent) {
            res.status(200).json({ message: "Successfully sent notification" });
            return;
        } else {
            res.status(400).json({ message: "Error sending notification" });
            return;
        }
    } catch (err) {
        return next(err);
    }
};

export const postSendTestClubNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { error } = postSendTestClubNotificationSchema.validate(req.body);

    if (error) {
        res.status(400).json({ "error": error.message });
        logger.debug(error);
        return;
    }
    try {
        const { message, id } = req.body;
        const userId = req.userId;

        if (!userId) {
            res.status(400).json({ error: "User not specified" });
            return;
        }

        const ownerRole = await Role.findOne({ name: "President" }).exec();

        const newNotification: INotificationInterface = {
            body: message ?? "Test notification",
            title: "Clubito Test Notification",
            data: {
                type: "event",
                id: "test id",
                role: ownerRole || undefined,
                title: "test title"
            }
        };

        const sent = await sendNotificationToClub(id, newNotification);
        if (sent) {
            res.status(200).json({ message: "Successfully sent notification" });
            return;
        } else {
            res.status(400).json({ message: "Error sending notification" });
            return;
        }
    } catch (err) {
        return next(err);
    }
};