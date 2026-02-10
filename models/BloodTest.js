import mongoose from 'mongoose';

const bloodTestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  price: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true,
});

const BloodTest = mongoose.model('BloodTest', bloodTestSchema);

export default BloodTest;
