import mongoose from 'mongoose';

const bookingSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model
      required: true,
    },

    testId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'testType', // Dynamic reference
    },
    testType: {
      type: String,
      required: true, // Ultrasound, Blood Test, etc.
    },
    date: {
      type: Date,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['Pay at clinic', 'Online'],
      default: 'PAC',
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed'],
      default: 'Pending',
    },
    cancelled: {
      type: Boolean,
      default: false,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
