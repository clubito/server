import httpServer from "./app";
import logger from "./util/logger";
import {ENVIRONMENT} from "./util/secrets";


// Express configuration
const port = process.env.PORT || 3000;
const env = ENVIRONMENT == "" ? "development" : ENVIRONMENT;

/**
 * Start Express server.
 */
const server = httpServer.listen(port, () => {
  logger.info(
      "  App is running at http://localhost:%d in %s mode",
      port,
      env,
  );
  logger.info("  Press CTRL-C to stop\n");
});

export default server;
