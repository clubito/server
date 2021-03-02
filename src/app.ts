import "module-alias/register";
import bodyParser from "body-parser";
import express from "express";
import mongoose from "mongoose";
import logger from "./util/logger";
import { MONGODB_URI } from "@secrets";

// Controllers (route handlers)
import * as homeController from "./controllers/home";
import * as authController from "./controllers/auth";
import User from "@models/User";
import Club from "@models/Club";
import Announcement from "@models/Announcement";
import Event from "@models/Event";
// import * as homeController from "./controllers/home";
// import * as homeController from "./controllers/home";



// Create Express server
const app = express();

// // Connect to MongoDB
const mongoUrl = MONGODB_URI;

const eraseDatabaseOnSync = false;


mongoose.connect(mongoUrl, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true } ).then(async () => {
  if (eraseDatabaseOnSync) {
    await Promise.all([
      User.deleteMany({}),
      Club.deleteMany({}),
      Announcement.deleteMany({}),
      Event.deleteMany({})
    ]);
    const user1 = new User({
      email: "aaumir@purdue.edu",
      password: "testpass1"
    });
    const user2 = new User({
      email: "lin854@purdue.edu",
      password: "testpass1"
    });
    const user3 = new User({
      email: "pramanik@purdue.edu",
      password: "testpass1"
    });
    const user4 = new User({
      email: "sriniv58@purdue.edu",
      password: "testpass1"
    });
    await user1.save();
    await user2.save();
    await user3.save();
    await user4.save();

    const club1 = new Club({
      name: "Drone Club",
      description: "A club for all drone enthusiasts at Purdue. Planes and multicopter pilots alike are welcome!",
    });
    const club2 = new Club({
      name: "PUDM",
      description: "PUDM is the largest student-run philanthropy on campus, raising over $9 million for Riley Hospital for Children to date!"
    });
    await club1.save();
    await club2.save();
    
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
app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  next();
});

// Enable for production
// app.use(compression()); 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// app.use(lusca.xframe("SAMEORIGIN"));
// app.use(lusca.xssProtection(true));


/**
 * Primary app routes.
 */
app.get("/", homeController.index);

// User authentication routes
app.post("/login", authController.postLogin);
app.post("/register", authController.postRegister);



export default app;
