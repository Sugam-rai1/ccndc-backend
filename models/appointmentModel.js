import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  docId: { type: String, required: true },
  slotDate: { type: String, required: true },
  slotTime: { type: String, required: true },
  userData: { type: Object, required: true },
  docData: { type: Object, required: true },
  amount: { type: Number, required: true },
  date: { type: Number, required: true },
  cancelled: { type: Boolean, default: false },
  payment: { type: String, default: "false" }, // string to track payment method
  codConfirmed: { type: Boolean, default: false }, // ✅ Add this line
  isCompleted: { type: Boolean, default: false },
});

const appointmentModel =
  mongoose.models.appointment || mongoose.model("appointment", appointmentSchema);

export default appointmentModel;
