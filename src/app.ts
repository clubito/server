import "module-alias/register";
import bodyParser from "body-parser";
import express from "express";
import mongoose from "mongoose";
import logger, { expressLogger } from "./util/logger";
import { MONGODB_URI } from "@secrets";
import cors from "cors";
import { ENVIRONMENT } from "./util/secrets";

// Controllers (route handlers)
import * as homeController from "./controllers/home";
import * as authController from "./controllers/auth";
import * as fileController from "./controllers/file";
import * as userController from "./controllers/user";
import * as clubController from "./controllers/club";
import * as adminController from "./controllers/admin";
import * as chatController from "./controllers/chat";
import * as EventController from "./controllers/event";
import * as notificationController from "./controllers/notifications";
import * as announcementController from "./controllers/announcement";

import User from "@models/User";
import Club from "@models/Club";
import Announcement from "@models/Announcement";
import Event from "@models/Event";
import Message from "@models/Message";

import { CLUB_ROLE, CLUB_TAGS, APP_ROLE, PERMISSIONS } from "@models/enums";
import { authenticateJWT } from "./util/auth";
import errorHandler from "errorhandler";

import { createServer } from "http";
import { Server } from "socket.io";
import Role from "@models/Role";


// Create Express server
const app = express();

app.use(expressLogger);

// // Connect to MongoDB
const mongoUrl = MONGODB_URI;

const eraseDatabaseOnSync = false;

mongoose.connect(mongoUrl, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true }).then(async () => {
  if (eraseDatabaseOnSync) {
    logger.info("Starting to populate DB with seed data");
    await Promise.all([
      User.deleteMany({}),
      Club.deleteMany({}),
      Announcement.deleteMany({}),
      Event.deleteMany({}),
      Message.deleteMany({}),
      Role.deleteMany({})
    ]);

    const memberRole = new Role({
      name: "Member",
      permissions: [],
      preset: true
    });

    const ownerRole = new Role({
      name: "President",
      permissions: Object.values(PERMISSIONS),
      preset: true
    });

    const nonMemberRole = new Role({
      name: "Non-Member",
      permissions: [],
      preset: true
    });

    const user1 = new User({
      name: "Aashir Aumir",
      email: "aaumir@purdue.edu",
      password: "testpass1",
      isConfirmed: true,
      profilePicture: "https://i.pravatar.cc/150?u=aaumir@purdue.edu"
    });
    const user2 = new User({
      name: "Fake User",
      email: "example1@purdue.edu",
      password: "testpass1",
      isConfirmed: true,
      profilePicture: "https://i.pravatar.cc/150?u=example1@purdue.edu"
    });
    const user3 = new User({
      name: "Amarto Pramanik",
      email: "pramanik@purdue.edu",
      password: "testpass1",
      isConfirmed: true,
      profilePicture: "https://i.pravatar.cc/150?u=pramanik@purdue.edu"
    });
    const user4 = new User({
      name: "Arjun Srinivasan",
      email: "sriniv58@purdue.edu",
      password: "testpass1",
      isConfirmed: true,
      profilePicture: "https://i.pravatar.cc/150?u=sriniv58@purdue.edu"
    });
    const user5 = new User({
      name: "Test User I",
      email: "test@purdue.edu",
      password: "testpass1",
      isConfirmed: true,
      profilePicture: "https://i.pravatar.cc/150?u=test@purdue.edu"
    });
    const user6 = new User({
      name: "Daddy Daniels",
      email: "mitch@purdue.edu",
      password: "testpass1",
      isConfirmed: true,
      profilePicture: "https://i.pravatar.cc/150?u=mitch@purdue.edu"
    });
    const user7 = new User({
      name: "Harambe",
      email: "harambe@purdue.edu",
      password: "testpass1",
      isConfirmed: true,
      appRole: APP_ROLE.ADMIN,
      profilePicture: "https://i.pravatar.cc/150?u=harambe@purdue.edu"
    });

    const club1 = new Club({
      name: "Drone Club",
      description: "A club for all drone enthusiasts at Purdue. Planes and multicopter pilots alike are welcome!",
      members: [{ member: user1._id, role: CLUB_ROLE.OWNER, role2: ownerRole },
      { member: user2._id, role: CLUB_ROLE.MEMBER, role2: memberRole },
      { member: user5._id, role: CLUB_ROLE.MEMBER, role2: memberRole }],
      tags: [CLUB_TAGS.TECHNOLOGY, CLUB_TAGS.SPORTS],
      isEnabled: true,
      logo: "https://i.pravatar.cc/150?u=DroneClub@purdue.edu"
    });
    const club2 = new Club({
      name: "PUDM",
      description: "PUDM is the largest student-run philanthropy on campus, raising over $9 million for Riley Hospital for Children to date!",
      members: [{ member: user2._id, role: CLUB_ROLE.OWNER, role2: ownerRole },
      { member: user3._id, role: CLUB_ROLE.MEMBER, role2: memberRole },
      { member: user4._id, role: CLUB_ROLE.MEMBER, role2: memberRole },
      { member: user6._id, role: CLUB_ROLE.MEMBER, role2: memberRole }],
      tags: [CLUB_TAGS.MUSIC, CLUB_TAGS.SPORTS, CLUB_TAGS.VOLUNTEERING],
      isEnabled: true,
      logo: "https://i.pravatar.cc/150?u=PUDM@purdue.edu"
    });

    const announcement1 = new Announcement({
      club: club1._id,
      message: "Please use an FDA-approved app to request flight clearance before every flight. They sent us a *very* strongly worded letter."
    });

    const event1 = new Event({
      name: "Dance Marathon",
      description: "Dance to raise money for charity!",
      startTime: Date.now(),
      endTime: Date.now() + 2 * 24 * 60 * 60 * 1000, // 2 days from now
      longitude: 40.454769,
      latitude: -86.915703,
      shortLocation: "Somewhere in West Lafayette, IN",
      club: club2._id
    });

    const message1 = new Message({
      author: user1._id,
      authorName: user1.name,
      club: club1._id,
      timestamp: Date.parse("2021-04-01T02:04:50.989Z"),
      body: "hello world!",
      attachment: "this is an attachment url"
    });
    const message2 = new Message({
      author: user1._id,
      authorName: user1.name,
      club: club1._id,
      timestamp: Date.parse("2021-03-01T02:04:50.989Z"),
      body: "good bye :D",
      attachment: "this is an attachment url"
    });
    const message3 = new Message({
      author: user2._id,
      authorName: user2.name,
      club: club1._id,
      timestamp: Date.parse("2021-03-02T02:04:50.989Z"),
      body: "test message from user 2",
      attachment: "this is an attachment url.com"
    });
    const message4 = new Message({
      author: user1._id,
      authorName: user1.name,
      club: club1._id,
      timestamp: Date.parse("2021-04-01T02:05:50.989Z"),
      body: "stacked message from aashir",
      attachment: "this is an attachment url.com"
    });
    const message5 = new Message({
      author: user5._id,
      authorName: user5.name,
      club: club1._id,
      timestamp: Date.parse("2021-04-02T03:05:50.989Z"),
      body: "stacked message from aashir",
      attachment: "this is an attachment url.com"
    });
    const message6 = new Message({
      author: user1._id,
      authorName: user1.name,
      club: club1._id,
      timestamp: Date.parse("2021-04-02T06:05:50.989Z"),
      body: "stacked message from aashir",
      attachment: "this is an attachment url.com"
    });
    const message7 = new Message({
      author: user5._id,
      authorName: user5.name,
      club: club1._id,
      timestamp: Date.parse("2021-04-02T09:05:50.989Z"),
      body: "stacked message from aashir",
      attachment: "this is an attachment url.com"
    });

    club1.roles.push(memberRole._id, ownerRole._id);
    club2.roles.push(memberRole._id, ownerRole._id);

    user1.clubs.push({ club: club1._id, role: CLUB_ROLE.OWNER, approvalDate: new Date(Date.now()), role2: ownerRole._id });
    user2.clubs.push({ club: club1._id, role: CLUB_ROLE.MEMBER, approvalDate: new Date(Date.now()), role2: memberRole._id });
    user2.clubs.push({ club: club2._id, role: CLUB_ROLE.OWNER, approvalDate: new Date(Date.now()), role2: ownerRole._id });
    user3.clubs.push({ club: club2._id, role: CLUB_ROLE.MEMBER, approvalDate: new Date(Date.now()), role2: memberRole._id });
    user4.clubs.push({ club: club2._id, role: CLUB_ROLE.MEMBER, approvalDate: new Date(Date.now()), role2: memberRole._id });
    user5.clubs.push({ club: club1._id, role: CLUB_ROLE.MEMBER, approvalDate: new Date(Date.now()), role2: memberRole._id });
    user6.clubs.push({ club: club2._id, role: CLUB_ROLE.MEMBER, approvalDate: new Date(Date.now()), role2: memberRole._id });

    club1.messages.push(message1._id);
    club1.messages.push(message2._id);
    club1.messages.push(message3._id);
    club1.messages.push(message4._id);
    club1.messages.push(message5._id);
    club1.messages.push(message6._id);
    club1.messages.push(message7._id);
    club1.announcements.push(announcement1._id);

    club2.events.push(event1._id);

    await user1.save();
    await user2.save();
    await user3.save();
    await user4.save();
    await user5.save();
    await user6.save();
    await user7.save();

    await club1.save();
    await club2.save();

    await announcement1.save();

    await event1.save();
    await message1.save();
    await message2.save();
    await message3.save();
    await message4.save();
    await message5.save();
    await message6.save();
    await message7.save();

    await memberRole.save();
    await ownerRole.save();
    await nonMemberRole.save();

    logger.info("Finished populating DB with seed data");
  }
},
)
  .then(() => {
    /** ready to use. The `mongoose.connect()` promise resolves to undefined. */
    logger.debug("MongoDB successfully connected!");
  })
  .catch(err => {
    logger.error(`MongoDB connection error. Please make sure MongoDB is running. ${err}`);
    process.exit();
  });

// Fix CORS
// app.use((_req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
//   next();
// });
app.use(cors());

// Enable for production
// app.use(compression()); 

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



/**
 * Primary app routes.
 */
app.get("/", homeController.index);

// User authentication routes
app.post("/login", authController.postLogin);
app.post("/logout", authenticateJWT, authController.postLogout);
app.post("/register", authController.postRegister);
app.post("/reset", authenticateJWT, authController.postReset);
app.post("/forgot", authController.postForgot);
app.get("/forgot/:token", authController.getForgot);
app.post("/token/verify", authController.postTokenVerify);
app.get("/verify/:secret", authController.getVerify);

app.get("/file", authenticateJWT, fileController.getS3PresignedUrl);

// Normal User routes
app.get("/user/profile", authenticateJWT, userController.getUserProfile);
app.put("/user/settings", authenticateJWT, userController.putSettings);
app.put("/user/profile", authenticateJWT, userController.putUserProfile);
app.delete("/user/profile", authenticateJWT, userController.deleteUserProfile);
app.get("/user/other/profile", authenticateJWT, userController.getAnotherUserProfile);
app.get("/user/club/events", authenticateJWT, userController.getUsersEvents);
app.get("/user/club/rsvp", authenticateJWT, userController.getUsersRsvps);

// Club routes 
app.post("/clubs/theme", authenticateJWT, clubController.editClubTheme);
app.get("/clubs/tags", authenticateJWT, clubController.getAllTags);
app.get("/clubs/profile", authenticateJWT, clubController.getClubProfile);
app.post("/clubs/join", authenticateJWT, clubController.postClubJoin);
app.get("/clubs/search", authenticateJWT, clubController.searchClubByName);
app.post("/clubs/request", authenticateJWT, clubController.postRequestClub);
app.get("/clubs/requests", authenticateJWT, clubController.getAllJoinRequests);
app.post("/clubs/request/approve", authenticateJWT, clubController.postClubApprove);
app.post("/clubs/request/deny", authenticateJWT, clubController.postClubDeny);
app.post("/clubs/kick", authenticateJWT, clubController.postClubKick);
app.post("/clubs/announcement/create", authenticateJWT, announcementController.postSendAnnouncement);
app.post("/clubs/gallery", authenticateJWT, clubController.postClubGallery);
app.get("/clubs/gallery", authenticateJWT, clubController.getClubGallery);
app.delete("/clubs/delete", authenticateJWT, clubController.deleteClub);
// TODO: create/edit/delete club events, approve/reject member registration, remove user from club, get (maybe add filter/search) all club events, get 1 event

// Admin routes
app.post("/admin/login", authController.postLoginAdmin);
app.get("/admin/clubs/requests", authenticateJWT, adminController.getAllClubRequests);
app.post("/admin/clubs/requests/approve", authenticateJWT, adminController.postApproveClubRequest);
app.post("/admin/clubs/requests/deny", authenticateJWT, adminController.postDenyClubRequest);
app.post("/admin/clubs/delete", authenticateJWT, adminController.deleteClub);
app.post("/admin/clubs/undelete", authenticateJWT, adminController.undeleteClub);
app.get("/admin/clubs", authenticateJWT, adminController.getAllClubs);
app.get("/admin/users", authenticateJWT, adminController.getAllUsers);
app.post("/admin/users/delete", authenticateJWT, adminController.deleteUser);
app.post("/admin/users/undelete", authenticateJWT, adminController.undeleteUser);
app.post("/admin/users/ban", authenticateJWT, adminController.banUser);
app.post("/admin/users/unban", authenticateJWT, adminController.unbanUser);
app.put("/admin/profile", authenticateJWT, userController.putUserProfile);
app.post("/admin/announcement", authenticateJWT, adminController.postSendAppAnnouncement);
// TODO: delete/undelete users, ban/unban users


// notifcation routes
app.post("/user/notifications/register", authenticateJWT, notificationController.postRegisterPushToken);
app.post("/user/notifications/message", authenticateJWT, notificationController.postSendTestNotification);
app.post("/user/notifications/clubmessage", authenticateJWT, notificationController.postSendTestClubNotification);
// app.put("/user/notifications/settings", authenticateJWT, notificationController.postRegisterPushToken);


// Event routes
app.post("/clubs/event/create", authenticateJWT, EventController.postCreateEvent);
app.put("/clubs/event/edit", authenticateJWT, EventController.putEditEvent);
app.get("/clubs/event", authenticateJWT, EventController.getEvent);
app.post("/clubs/event/rsvp", authenticateJWT, EventController.postAddRsvp);
app.delete("/clubs/event/rsvp", authenticateJWT, EventController.postDeleteRsvp);
app.get("/clubs/event/rsvp", authenticateJWT, EventController.getRsvp);
app.get("/clubs/events/current", authenticateJWT, EventController.getCurrentEvents);

// Chat routes
app.get("/clubs/threads", authenticateJWT, chatController.getThreadMessages);
app.get("/clubs/messages", authenticateJWT, chatController.getMessagesByClub);

// Role routes
app.get("/clubs/roles", authenticateJWT, clubController.getClubRoles);
app.put("/clubs/role", authenticateJWT, clubController.putClubRole);
app.post("/clubs/role", authenticateJWT, clubController.postClubRole);
app.delete("/clubs/role", authenticateJWT, clubController.deleteClubRoles);
app.post("/clubs/role/assign", authenticateJWT, clubController.postAssignClubRole);

/*
register:
after clicking on confirmation link, send back to app - app POSTS to confirmation link - set isconfirmed to true and return JWT


user:
GET profile (everything all populated)
post profile update (name, profile picture, bio) XXX: Add the bio
post reset password/forget
post club request

each club:
get club, return everything

club search:
given query (name/tags/asc,desc(based on name/member count)), return name,active member count, logo, description, tags
GET all tags



*/

/**
 * Error Handler. Provides full stack
 */
if (ENVIRONMENT === "development") {
  app.use(errorHandler());
}

// CHAT APPLICATION
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {}
});
chatController.chatServer(io);

export default httpServer;
