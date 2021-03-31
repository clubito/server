import User from "@models/User";
import Expo, { ExpoPushMessage } from "expo-server-sdk";
import { INotificationInterface } from "@models/Interfaces/INotificationInterface";
import logger from "@logger";

const expo = new Expo();

export const isValidPushToken = (pushToken: string): boolean => {
    return Expo.isExpoPushToken(pushToken);
};

export const sendNotificationToUser = async (userId: string, notification: INotificationInterface): Promise<boolean> => {
    try {
        logger.info("Sending notification", userId, notification);
        const user = await User.findById(userId).exec();

        if (!user) {
            throw new Error("User not found");
        }

        if (!user.pushToken) {
            throw new Error("User has not set up push notifications");
        }

        if (!user.settings.notifications.enabled) {
            throw new Error("User has disable notifications");
        }

        const messages: ExpoPushMessage[] = [];
        messages.push({
            to: user.pushToken,
            sound: "default",
            body: notification.body ?? "New Clubito notification!",
            data: notification.data,
            title: notification.title ?? "Clubito"
        });

        // XXX: For now just send notifcations as we get them, but maybe in sprint 3, we can 
        // improve this and batch notifcations. Maybe queue up notifications, and send every 20 secs
        const ticket = await (expo.sendPushNotificationsAsync(messages) as any)[0];
        const receiptIds: any[] = [];
        if (ticket.id) {
            receiptIds.push(ticket.id);
        }
        const receipt = await expo.getPushNotificationReceiptsAsync(receiptIds)[0];
        const status = receipt?.status;
        const details = receipt?.details;
        if (status === "ok") {
            return Promise.resolve(true);
        } else {
            throw new Error(`There was an error sending a notification: ${details}`);
        }
    } catch (err) {
        logger.error(err);
        throw err;
    }
};

// Add a send push notification given the user id/message/data