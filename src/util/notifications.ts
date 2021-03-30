import User from "@models/User";
import Expo, { ExpoPushMessage } from "expo-server-sdk";
import { INotificationInterface } from "@models/Interfaces/INotificationInterface";

const expo = new Expo();

export const isValidPushToken = (pushToken: string): boolean => {
    return Expo.isExpoPushToken(pushToken);
};

export const sendNotification = async (userId: string, notification: INotificationInterface): Promise<boolean> => {
    try {
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
        const tickets = await expo.sendPushNotificationsAsync(messages) as any;

        const receiptIds: any[] = [];
        for (const ticket of tickets) {
            if (ticket.id) {
                receiptIds.push(ticket.id);
            }
        }
        const receipts = await expo.getPushNotificationReceiptsAsync(receiptIds);
        for (const receiptId in receipts) {
            const status = receipts[receiptId]?.status;
            const details = receipts[receiptId]?.details;
            if (status === "ok") {
                return Promise.resolve(true);
            } else {
                throw new Error(`There was an error sending a notification: ${details}`);
            }
        }
    } catch (err) {
        throw err;
    }
    throw new Error("Error sending notification");
};

// Add a send push notification given the user id/message/data