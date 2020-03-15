const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const moment = require("moment");
const fs = require("fs");
const Notes = require("../models/notes");
const userAuth = require("../middleware/userAuth");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString() + "-" + file.originalname);
  }
});
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 },
  fileFilter: fileFilter
});

router.get("/", userAuth, (req, res, next) => {
  Notes.find({ userID: req.userData._id })
    .exec()
    .then(result => {
      if (result.length > 0) {
        const response = {
          count: result.length,
          notes: result.map(note => {
            return {
              _id: note._id,
              selfiImage: note.selfiImage,
              note: note.note,
              datetime: note.datetime,
              lanlon: note.lanlon,
              request: {
                type: "GET",
                url: "http://localhost:4000/notes/" + note._id
              }
            };
          })
        };
        res.status(200).json(response);
      } else {
        res.status(200).json({
          message: "No notes are present please create one."
        });
      }
    })
    .catch(err => {
      res.status(500).json({
        error: err
      });
    });
});

router.get("/:noteId", userAuth, (req, res, next) => {
  Notes.findById(req.params.noteId)
    .exec()
    .then(result => {
      if (result) {
        if (result.userID == req.userData._id) {
          res.status(200).json({
            note: result,
            request: {
              type: "GET",
              url: "http://localhost:4000/notes/"
            }
          });
        } else {
          return res.status(400).json({
            error: "No note with this id"
          });
        }
      } else {
        res.status(400).json({
          error: "No note with this id"
        });
      }
    })
    .catch(err => {
      res.status(500).json({
        error: err
      });
    });
});
router.post("/", userAuth, upload.single("selfiImage"), (req, res, next) => {
  const date = moment().format("ll");
  const time = moment().format("LTS");
  const notes = new Notes({
    _id: mongoose.Types.ObjectId(),
    selfiImage: req.file.path,
    note: req.body.notee,
    datetime: {
      date: date,
      time: time
    },
    latlon: { lat: req.body.lat, lon: req.body.lon },
    userID: req.userData._id
  });
  notes
    .save()
    .then(result => {
      res.status(200).json({
        message: "Note created",
        request: {
          type: "POST",
          url: "http://localhost:4000/notes/" + result._id
        }
      });
    })
    .catch(err => {
      res.status(500).json({
        message: "Some internal error occure",
        error: err
      });
    });
});

router.delete("/:noteId", userAuth, (req, res, next) => {
  Notes.findById(req.params.noteId)
    .exec()
    .then(result => {
      if (result) {
        if (result.userID == req.userData._id) {
          Notes.remove({ _id: req.params.noteId })
            .exec()
            .then(doc => {
              res.status(200).json({
                message: "Note deleted."
              });
            })
            .catch(err => {
              error: err;
            });
        } else {
          return res.status(400).json({
            error: "No note with this id"
          });
        }
      } else {
        res.status(400).json({
          error: "No note with this id"
        });
      }
    })
    .catch(err => {
      res.status(500).json({
        error: err
      });
    });
});

router.patch(
  "/:noteId",
  userAuth,
  upload.single("selfiImage"),
  (req, res, next) => {
    Notes.findById(req.params.noteId)
      .exec()
      .then(result => {
        if (result) {
          if (result.userID == req.userData._id) {
            try {
              const updateOps = {};
              if (req.file.path != null) {
                if (fs.existsSync("./" + result.selfiImage)) {
                  fs.unlinkSync("./" + result.selfiImage, err => {
                    if (err) throw err;
                    console.log("successfully deleted /tmp/hello");
                  });
                }
                updateOps["selfiImage"] = req.file.path;
              }


              if (req.body.note != null) {
                console.log(req.body.note);
                updateOps["note"] = req.body.note;
              }

              Notes.update({ _id: req.params.noteId }, { $set: updateOps })
                .exec()
                .then(doc => {
                  res.status(200).json({
                    message: "Product updated",
                    note: doc
                  });
                })
                .catch(err => {
                  console.log("Update Fail");
                  return res.status(500).json({
                    error: err
                  });
                });
            } catch (err) {
              res.status(500).json({
                error: err
              });
            }
          } else {
            return res.status(400).json({
              error: "No note with this id"
            });
          }
        } else {
          res.status(400).json({
            error: "No note with this id"
          });
        }
      })
      .catch(err => {
        res.status(500).json({
          error: err
        });
      });
  }
);

module.exports = router;
