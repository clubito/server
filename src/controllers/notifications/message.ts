import { NextFunction, Request, Response } from "express";
import logger from "@logger";
import joi from "joi";
import { sendNotification } from "@notifications";
import { INotificationInterface } from "@models/Interfaces/INotificationInterface";

const postSendTestNotificationSchema = joi.object().keys({
    message: joi.string().required()
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


        const newNotification: INotificationInterface = {
            body: message ?? "Test notification",
            title: "Clubito Test Notification",
            data: {
                type: "event",
                id: "test id",
                role: "OWNER",
                title: "test title"
            }
        };

        const sent = await sendNotification(userId, newNotification);
        if (sent) {
            res.status(200).json({ message: "Successfully sent notification" });
        } else {
            res.status(400).json({ message: "Error sending notification" });
        }
        return;
    } catch (err) {
        return next(err);
    }
};