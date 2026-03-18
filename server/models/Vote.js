const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    options: [{ type: String, required: true }],
    responses: [
      {
        member: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        choice: { type: String },
        votedAt: { type: Date, default: Date.now },
      },
    ],
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Vote', voteSchema);
