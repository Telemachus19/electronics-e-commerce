const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      minlength: 2,
      maxlength: 40
    },
    description: {
      type: String,
      trim: true,
      maxlength: 255
    },
    permissions: {
      type: [String],
      default: []
    },
    isSystem: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

module.exports = mongoose.model('Role', roleSchema);