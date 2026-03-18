const mongoose = require('mongoose');

const financialSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['income', 'expense'], required: true },
    category: {
      type: String,
      enum: ['dues', 'fine', 'maintenance', 'utilities', 'insurance', 'legal', 'administrative', 'other'],
      required: true,
    },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    date: { type: Date, default: Date.now },
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isPaid: { type: Boolean, default: false },
    paidDate: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Financial', financialSchema);
