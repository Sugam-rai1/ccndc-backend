import express from 'express';
import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment,
  confirmCOD,
  getUltrasounds,
  getBloodTests,
  bookTestAppointment,
  getTestAppointments,
  cancelTestAppointment,
  googleLogin // ✅ Import googleLogin
} from '../controllers/userController.js';

import authUser from '../middleware/authUser.js';
import upload from '../middleware/multer.js';
import Ultrasound from '../models/Ultrasound.js';
import BloodTest from '../models/BloodTest.js';

const userRouter = express.Router();

// Public routes
userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.post('/google-login', googleLogin); // ✅ Google login route added

// Protected routes
userRouter.get('/get-profile', authUser, getProfile);
userRouter.post('/update-profile', authUser, upload.single('image'), updateProfile);
userRouter.post('/book-appointment', authUser, bookAppointment);
userRouter.get('/appointments', authUser, listAppointment);
userRouter.post('/cancel-appointment', authUser, cancelAppointment);
userRouter.post('/confirm-cod', authUser, confirmCOD);

// Test appointments
userRouter.post('/book-test-appointment', authUser, bookTestAppointment);
userRouter.get('/bookings', authUser, getTestAppointments);
userRouter.post('/cancel-test-appointment', authUser, cancelTestAppointment);

// Ultrasound routes
userRouter.get('/ultrasound/list', async (req, res) => {
  try {
    const ultrasounds = await Ultrasound.find();
    res.status(200).json({ success: true, ultrasounds });
  } catch (error) {
    console.error("Ultrasound fetch error:", error);
    res.status(500).json({ success: false, message: "Error fetching ultrasounds" });
  }
});

userRouter.post('/ultrasound/add', async (req, res) => {
  const { name, description, price } = req.body;
  try {
    const newUltrasound = new Ultrasound({ name, description, price });
    await newUltrasound.save();
    res.status(201).json({ success: true, message: 'Ultrasound service added successfully!' });
  } catch (error) {
    console.error("Error adding ultrasound service:", error);
    res.status(500).json({ success: false, message: 'Error adding ultrasound service' });
  }
});

// Blood test routes
userRouter.get('/bloodtest/list', async (req, res) => {
  try {
    const bloodTests = await BloodTest.find();
    res.status(200).json({ success: true, bloodTests });
  } catch (error) {
    console.error("Blood tests fetch error:", error);
    res.status(500).json({ success: false, message: "Error fetching blood tests" });
  }
});

userRouter.post('/bloodtest/add', async (req, res) => {
  const { name, description, price } = req.body;
  try {
    const newBloodTest = new BloodTest({ name, description, price });
    await newBloodTest.save();
    res.status(201).json({ success: true, message: 'Blood test service added successfully!' });
  } catch (error) {
    console.error("Error adding blood test service:", error);
    res.status(500).json({ success: false, message: 'Error adding blood test service' });
  }
});

export default userRouter;
