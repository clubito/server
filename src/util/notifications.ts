import User from "@models/User";
import Expo, { ExpoPushMessage } from "expo-server-sdk";
import { INotificationInterface } from "@models/Interfaces/INotificationInterface";
import logger from "@logger";
import Club from "@models/Club";
import Event from "@models/Event";

const expo = new Expo();

export const isValidPushToken = (pushToken: string): boolean => {
    return Expo.isExpoPushToken(pushToken);
};

export const sendKickedNotificationToUser = async (userId: string, clubId: string, clubName: string, userRole: string, reason: string): Promise<boolean> => {
    try {
        const kickNotification: INotificationInterface = {
            body: `Reason: ${reason ?? "N/A"}`,
            title: `You were kicked from ${clubName}`,
            data: {
                type: "club",
                id: clubId,
                title: clubName,
                role: userRole
            }
        };
        await sendNotificationToUser(userId, kickNotification);
        return Promise.resolve(true);
    } catch (err) {
        logger.error(err);
        return Promise.resolve(false);
    }
};


export const sendBannedNotificationToUser = async (userId: string): Promise<boolean> => {
    try {
        const bannedNotification: INotificationInterface = {
            body: "Please contact support for additional information",
            title: "You were banned from Clubito",
            data: {
                type: "ban"
            }
        };
        await sendNotificationToUser(userId, bannedNotification);
        return Promise.resolve(true);
    } catch (err) {
        logger.error(err);
        return Promise.resolve(false);
    }
};

export const sendClubAnnouncementNotification = async (clubId: string, clubName: string, userRole: string, message: string): Promise<boolean> => {
    try {
        const announcementNotification: INotificationInterface = {
            body: `${message}`,
            title: `${clubName}`,
            data: {
                type: "club",
                id: clubId,
                title: clubName,
                role: userRole
            }
        };
        await sendNotificationToClub(clubId, announcementNotification);
        return Promise.resolve(true);
    } catch (err) {
        logger.error(err);
        return Promise.resolve(false);
    }
};


export const sendEventEditedNotification = async (eventId: string, clubName: string, userRole: string, eventName: string): Promise<boolean> => {
    try {
        const eventEditedNotification: INotificationInterface = {
            body: `${eventName} by ${clubName} has been updated!`,
            title: `${eventName}`,
            data: {
                type: "event",
                id: eventId,
                title: clubName,
                role: userRole
            }
        };
        await sendNotificationToEventRsvp(eventId, eventEditedNotification);
        return Promise.resolve(true);
    } catch (err) {
        logger.error(err);
        return Promise.resolve(false);
    }
};

export const sendNotificationToUser = async (userId: string, notification: INotificationInterface): Promise<boolean> => {
    try {
        logger.info("Sending notification", userId, notification);
        const user = await User.findById(userId).exec();

        if (!user) {
            throw new Error("User not found");
            // return Promise.resolve(false);
        }

        if (!user.pushToken) {
            // return Promise.resolve(false);
            throw new Error("User has not set up push notifications");
        }

        if (!user.settings.notifications.enabled) {
            // return Promise.resolve(false);
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
                if (member?.member?.settings?.notifications?.enabled) {
                    sendToArray.push(member.member.pushToken);
                }
            }
        });

        if (sendToArray.length === 0) {
            // The club has not members with notifications turned on
            return Promise.resolve(true);
        }

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

export const sendNotificationToEventRsvp = async (eventId: string, notification: INotificationInterface): Promise<boolean> => {
    try {
        logger.info("Sending notification to event rsvp", eventId, notification);
        const event = await Event
            .findById(eventId)
            .populate("rsvpUsers")
            .exec();

        if (!event) {
            throw new Error("Event not found");
        }

        const sendToArray: string[] = [];

        event.rsvpUsers.forEach(member => {
            if (member?.pushToken) {
                if (member?.settings?.notifications?.enabled) {
                    sendToArray.push(member.pushToken);
                }
            }
        });

        if (sendToArray.length === 0) {
            // The club has not members with notifications turned on
            return Promise.resolve(true);
        }

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