const express = require("express");
const app = express();
const mongoose = require("mongoose");
const morgan = require("morgan");
const bodyParser = require("body-parser");

const userRoutes = require("./api/routes/user");
const notesRoutes = require("./api/routes/notes");

app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use("/uploads", express.static("uploads"));

mongoose.connect(
  <Your mongodb atlas cluster url>,
  { useNewUrlParser: true }
);
mongoose.Promise = global.Promise;

//Handling cors error
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin,X-Requested-With,Control-Type,Accept,Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT,POST,PATCH,DELETE");
    return res.status(200).json({});
  }
  next();
});

app.use("/user", userRoutes);
app.use("/notes", notesRoutes);

//error handling
app.use((req, res, next) => {
  const error = new Error("Not found");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    Error: {
      message: error.message
    }
  });
});

module.exports = app;
