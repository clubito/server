import User from "@models/User";
import Expo, { ExpoPushMessage } from "expo-server-sdk";
import { INotificationInterface } from "@models/Interfaces/INotificationInterface";
import logger from "@logger";
import Club from "@models/Club";

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
        await expo.sendPushNotificationsAsync(messages);
        return Promise.resolve(true);
    } catch (err) {
        logger.error(err);
        throw err;
    }
};

export const sendNotificationToClub = async (clubId: string, notification: INotificationInterface): Promise<boolean> => {
    try {
        logger.info("Sending notification to club", clubId, notification);
        const club = await Club
            .findOne({ _id: clubId, "deleted.isDeleted": false })
            .populate({
                path: "members",
                populate: { path: "member" }
            }).exec();

        if (!club) {
            throw new Error("Club not found");
        }

        const sendToArray: string[] = [];

        club.members.forEach(member => {
            if (member?.member?.pushToken) {
                if (member?.member?.settings?.notification?.enabled) {
                    sendToArray.push(member.member.pushToken);
                }
            }
        });

        const messages: ExpoPushMessage[] = [];
        messages.push({
            to: sendToArray,
            sound: "default",
            body: notification.body ?? "New Clubito notification!",
            data: notification.data,
            title: notification.title ?? "Clubito"
        });
        await expo.sendPushNotificationsAsync(messages);
        return Promise.resolve(true);
    } catch (err) {
        logger.error(err);
        throw err;
    }
};