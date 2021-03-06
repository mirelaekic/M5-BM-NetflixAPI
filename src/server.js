const express = require("express");
const cors = require("cors");
const listEndpoints = require("express-list-endpoints");

const moviesRouter = require("./services/movies");
const reviewsRouter = require("./services/reviews");

const {
    notFoundHandler,
    badRequestHandler,
    genericErrorHandler,
  } = require("./errorHandlers");

const server = express();

const port = process.env.PORT || 3004;

server.use(express.json());

const whiteList =
  process.env.NODE_ENV === "production"
    ? [process.env.FE_URL_PROD]
    : [process.env.FE_URL_DEV];

    const corsOptions = {
        origin: function (origin, callback) {
          if (whiteList.indexOf(origin) !== -1) {
            callback(null, true)
          } else {
            callback(new Error("NOT ALLOWED - CORS ISSUES"))
          }
        },
      };
      server.use(cors());

server.use("/movies",moviesRouter);
server.use("/reviews", reviewsRouter);

server.use(badRequestHandler);
server.use(notFoundHandler);
server.use(genericErrorHandler);

console.log(listEndpoints(server));

server.listen(port, () => {
  if (process.env.NODE_ENV === "production") {
    console.log("Running on cloud on port", port)
  } else {
    console.log("Running locally on port", port)
  }
});