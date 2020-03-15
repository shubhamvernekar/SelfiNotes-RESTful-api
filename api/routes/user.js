const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const userAuth = require("../middleware/userAuth");

router.post("/login", (req, res, next) => {
  User.find({ email: req.body.email })
    .exec()
    .then(user => {
      bcrypt.compare(req.body.password, user[0].password, (err, result) => {
        if (err) {
          return res.status(500).json({
            error: err
          });
        }
        //result=true if password match o.w false
        if (result) {
          const token = jwt.sign(
            {
              email: user[0].email,
              _id: user[0]._id
            },
            process.env.JWT_KEY,
            { expiresIn: "1h" }
          );
          res.status(200).json({
            message: "Auth success",
            token: token
          });
        } else {
          res.status(401).json({
            error: "Auth fail"
          });
        }
      });
    })
    .catch(err => {
      res.status(500).json({
        error: err,
        message: "No user present, please signup"
      });
    });
});

router.post("/signup", (req, res, next) => {
  User.find({ email: req.body.email })
    .exec()
    .then(users => {
      if (users.length < 1) {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            return res.status(500).json({
              error: err
            });
          } else {
            const user = new User({
              _id: mongoose.Types.ObjectId(),
              email: req.body.email,
              password: hash
            });
            user
              .save()
              .then(result => {
                res.status(200).json({
                  message: "user created",
                  user: result,
                  request: {
                    type: "POST",
                    url: "http://localhost:4000/user/login"
                  }
                });
              })
              .catch(err => {
                res.status(500).json({
                  error: err
                });
              });
          }
        });
      } else {
        return res.status(500).json({
          error: "User already exist"
        });
      }
    })
    .catch(err => {
      res.status(500).json({
        error: err
      });
    });
});

router.delete("/", userAuth, (req, res, next) => {
  const userId = req.userData._id;
  User.remove({ _id: userId })
    .exec()
    .then(result => {
      res.status(200).json({ message: "User deleted" });
    })
    .catch(err => {
      res.status(500).json({
        error: err
      });
    });
});

module.exports = router;
