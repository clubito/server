import bodyParser from "body-parser";
import express from "express";
import mongoose from "mongoose";
import logger from "./util/logger";
import { MONGODB_URI } from "./util/secrets";

// Controllers (route handlers)
import * as homeController from "./controllers/home";
import * as authController from "./controllers/auth";
// import * as homeController from "./controllers/home";
// import * as homeController from "./controllers/home";



// Create Express server
const app = express();

// // Connect to MongoDB
const mongoUrl = MONGODB_URI;

mongoose.connect(mongoUrl, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true } ).then(
  () => { /** ready to use. The `mongoose.connect()` promise resolves to undefined. */ },
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
