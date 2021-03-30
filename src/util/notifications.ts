import Expo, { ExpoPushMessage } from "expo-server-sdk";

const expo = new Expo();

export const isValidPushToken = (pushToken: string): boolean => {
    return Expo.isExpoPushToken(pushToken);
};

// Add a send push notification given the user id/message/data