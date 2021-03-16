import "module-alias/register";
import bodyParser from "body-parser";
import express from "express";
import mongoose from "mongoose";
import logger, { expressLogger } from "./util/logger";
import { MONGODB_URI } from "@secrets";
import cors from "cors";

// Controllers (route handlers)
import * as homeController from "./controllers/home";
import * as authController from "./controllers/auth";
import * as fileController from "./controllers/file";
import * as userController from "./controllers/user";
import * as clubController from "./controllers/club";
import * as adminController from "./controllers/admin";

import User from "@models/User";
import Club from "@models/Club";
import Announcement from "@models/Announcement";
import Event from "@models/Event";
import { CLUB_ROLE, CLUB_TAGS, APP_ROLE } from "@models/enums";
import { authenticateJWT } from "./util/auth";
// import * as homeController from "./controllers/home";
// import * as homeController from "./controllers/home";


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
      Event.deleteMany({})
    ]);

    const user1 = new User({
      name: "Aashir Aumir",
      email: "aaumir@purdue.edu",
      password: "testpass1",
      isConfirmed: true
    });
    const user2 = new User({
      name: "Fake User",
      email: "example1@purdue.edu",
      password: "testpass1",
      isConfirmed: true
    });
    const user3 = new User({
      name: "Amarto Pramanik",
      email: "pramanik@purdue.edu",
      password: "testpass1",
      isConfirmed: true
    });
    const user4 = new User({
      name: "Arjun Srinivasan",
      email: "sriniv58@purdue.edu",
      password: "testpass1",
      isConfirmed: true
    });
    const user5 = new User({
      name: "Test User I",
      email: "test@purdue.edu",
      password: "testpass1",
      isConfirmed: true
    });
    const user6 = new User({
      name: "Daddy Daniels",
      email: "mitch@purdue.edu",
      password: "testpass1",
      isConfirmed: true
    });
    const user7 = new User({
      name: "Harambe",
      email: "harambe@purdue.edu",
      password: "testpass1",
      isConfirmed: true,
      appRole: APP_ROLE.ADMIN
    });

    const club1 = new Club({
      name: "Drone Club",
      description: "A club for all drone enthusiasts at Purdue. Planes and multicopter pilots alike are welcome!",
      members: [{ member: user1._id, role: CLUB_ROLE.OWNER },
      { member: user2._id, role: CLUB_ROLE.OFFICER },
      { member: user5._id, role: CLUB_ROLE.MEMBER }],
      tags: [CLUB_TAGS.TECHNOLOGY, CLUB_TAGS.SPORTS],
      isEnabled: true
    });
    const club2 = new Club({
      name: "PUDM",
      description: "PUDM is the largest student-run philanthropy on campus, raising over $9 million for Riley Hospital for Children to date!",
      members: [{ member: user2._id, role: CLUB_ROLE.OWNER },
      { member: user3._id, role: CLUB_ROLE.MEMBER },
      { member: user4._id, role: CLUB_ROLE.MEMBER },
      { member: user6._id, role: CLUB_ROLE.OFFICER }],
      tags: [CLUB_TAGS.MUSIC, CLUB_TAGS.SPORTS, CLUB_TAGS.VOLUNTEERING],
      isEnabled: true
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

    user1.clubs.push({ club: club1._id, role: CLUB_ROLE.OWNER });
    user2.clubs.push({ club: club1._id, role: CLUB_ROLE.OFFICER });
    user2.clubs.push({ club: club2._id, role: CLUB_ROLE.OWNER });
    user3.clubs.push({ club: club2._id, role: CLUB_ROLE.MEMBER });
    user4.clubs.push({ club: club2._id, role: CLUB_ROLE.MEMBER });
    user5.clubs.push({ club: club1._id, role: CLUB_ROLE.MEMBER });
    user6.clubs.push({ club: club2._id, role: CLUB_ROLE.OFFICER });


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

// Express configuration
app.set("port", process.env.PORT || 3000);

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
app.post("/register", authController.postRegister);
app.post("/reset", authenticateJWT, authController.postReset);
app.post("/forgot", authController.postForgot);
app.get("/forgot/:token", authController.getForgot);
app.post("/token/verify", authController.postTokenVerify);
app.get("/verify/:secret", authController.getVerify);

app.get("/file", authenticateJWT, fileController.getS3PresignedUrl);

// Normal User routes
app.get("/user/profile", authenticateJWT, userController.getUserProfile);
app.put("/user/profile", authenticateJWT, userController.putUserProfile);
app.delete("/user/profile", authenticateJWT, userController.deleteUserProfile);

// Club routes 
app.get("/clubs/tags", authenticateJWT, clubController.getAllTags);
app.get("/clubs/profile", authenticateJWT, clubController.getClubProfile);
app.post("/clubs/join", authenticateJWT, clubController.postClubJoin);
app.get("/clubs/search", authenticateJWT, clubController.searchClubByName);
app.post("/clubs/request", authenticateJWT, clubController.postRequestClub);

// Admin routes
app.get("/clubs/requests", authenticateJWT, adminController.getAllClubRequests);
app.post("/clubs/approve", authenticateJWT, adminController.postApproveClubRequest);
// app.get("/clubs/search", clubController.getClubSearch);

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


export default app;
