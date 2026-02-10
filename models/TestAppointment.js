import mongoose from 'mongoose';

const testAppointmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // ensure User model exists
    required: true,
  },
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test', // ensure Test model exists (could be BloodTest, UltrasoundTest, etc.)
    required: true,
  },
  testType: {
    type: String,
    required: true,
  },
  date: {
    type: Date, // changed to Date type for better date handling
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['Pay at clinic', 'Online'],
    default: 'Pay at clinic',
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  cancelled: {
    type: Boolean,
    default: false,
  }
}, {
  timestamps: true, // automatically adds createdAt and updatedAt fields
});

// Optionally, add indexing for frequently queried fields
testAppointmentSchema.index({ userId: 1 });
testAppointmentSchema.index({ testId: 1 });

const TestAppointment = mongoose.model('TestAppointment', testAppointmentSchema);

export default TestAppointment;
