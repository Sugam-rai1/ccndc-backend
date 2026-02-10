import mongoose from 'mongoose';

const ultrasoundSchema = new mongoose.Schema({
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

const Ultrasound = mongoose.model('Ultrasound', ultrasoundSchema);

export default Ultrasound;
