const mongoose = require('mongoose');

const violationSchema = new mongoose.Schema(
  {
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, required: true },
    type: {
      type: String,
      enum: ['landscaping', 'parking', 'noise', 'property_maintenance', 'rule_violation', 'other'],
      default: 'other',
    },
    status: {
      type: String,
      enum: ['open', 'notice_sent', 'hearing_scheduled', 'resolved', 'fined'],
      default: 'open',
    },
    fineAmount: { type: Number, default: 0 },
    dueDate: { type: Date },
    notes: { type: String },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Violation', violationSchema);
