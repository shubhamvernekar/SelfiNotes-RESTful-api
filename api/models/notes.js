const mongoose = require("mongoose");

const notesSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  selfiImage: { type: String },
  note: { type: String, required: true },
  datetime: {
    date: { type: String, required: true },
    time: { type: String, required: true }
  },
  latlon: {
    lat: { type: String },
    lon: { type: String }
  },
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  }
});

module.exports = mongoose.model("Notes", notesSchema);
