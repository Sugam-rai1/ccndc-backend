import validator from 'validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import {v2 as cloudinary } from 'cloudinary';
import userModel from '../models/userModel.js';
import doctorModel from '../models/doctorModel.js';
import appointmentModel from '../models/appointmentModel.js';
import BloodTest from '../models/BloodTest.js';
import Ultrasound from '../models/Ultrasound.js';
import Booking from '../models/Booking.js';
import User from '../models/userModel.js';
import { OAuth2Client } from 'google-auth-library';
  // Ensure correct path
// Make sure this is implemented
import sendEmail from '../utils/sendEmail.js';  // Add .js extension for ES Modules

// Register User
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Missing details" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: "Enter a valid email" });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Enter a strong password" });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({ name, email, password: hashedPassword });
    const user = await newUser.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({ success: true, token });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Login User
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(400).json({ success: false, message: 'User does not exist' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ success: true, token });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get User Profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const userData = await userModel.findById(userId).select('-password');
    res.json({ success: true, userData });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    // Destructure and parse fields
    const { name, email, phone, gender, dob } = req.body;
    let address = {};

    if (req.body.address) {
      try {
        address = JSON.parse(req.body.address);
      } catch (parseErr) {
        return res.status(400).json({ success: false, message: "Invalid address format" });
      }
    }

    const imageFile = req.file;

    let updatedData = {
      name,
      email,
      phone,
      gender,
      dob,
      address,
    };

    // If there's an image file, upload it and update the user's image URL
    if (imageFile) {
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' });
      updatedData.image = imageUpload.secure_url;
    }

    // Now update the user with the new data
    await userModel.findByIdAndUpdate(userId, updatedData, { new: true });

    res.json({ success: true, message: "Profile Updated" });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Book Appointment
export const bookAppointment = async (req, res) => {
  try {
    const { docId, slotDate, slotTime } = req.body;
    const userId = req.userId;

    if (!userId || !docId || !slotDate || !slotTime) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const docData = await doctorModel.findById(docId).select('-password');
    if (!docData) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    if (!docData.available) {
      return res.status(400).json({ success: false, message: 'Doctor not available' });
    }

    const existingAppointment = await appointmentModel.findOne({
      userId,
      docId,
      slotDate,
      slotTime,
      cancelled: { $ne: true } // Don't block if previous was canceled
    });

    if (existingAppointment) {
      return res.status(400).json({ success: false, message: 'You have already booked this slot' });
    }

    const userData = await userModel.findById(userId).select('-password');
    if (!userData) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const slots_booked = { ...docData.slots_booked };
    if (!slots_booked[slotDate]) {
      slots_booked[slotDate] = [];
    }

    if (slots_booked[slotDate].includes(slotTime)) {
      return res.status(400).json({ success: false, message: 'Slot already booked' });
    }

    slots_booked[slotDate].push(slotTime);

    const appointmentData = {
      userId,
      docId,
      userData,
      docData,
      amount: docData.fee,
      slotTime,
      slotDate,
      date: Date.now(),
    };

    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();

    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    res.json({ success: true, message: 'Appointment booked successfully' });

  } catch (error) {
    console.error('Appointment Booking Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error booking appointment' });
  }
};

// List User Appointments
export const listAppointment = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized: No user ID" });
    }

    const appointments = await appointmentModel.find({ userId });
    res.json({ success: true, appointments });
  } catch (error) {
    console.error("Error in listAppointment:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cancel Appointment
export const cancelAppointment = async (req, res) => {
  try {
    const { userId, appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);

    if (!appointmentData) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointmentData.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized action' });
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });

    const { docId, slotDate, slotTime } = appointmentData;
    const doctorData = await doctorModel.findById(docId);

    if (doctorData?.slots_booked?.[slotDate]) {
      doctorData.slots_booked[slotDate] = doctorData.slots_booked[slotDate].filter(
        (e) => e !== slotTime
      );
      await doctorModel.findByIdAndUpdate(docId, { slots_booked: doctorData.slots_booked });
    }

    res.json({ success: true, message: 'Appointment Cancelled' });
  } catch (error) {
    console.error("Cancel Appointment Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
export const confirmCOD = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const userId = req.userId;

    if (!appointmentId || !userId) {
      return res.status(400).json({ success: false, message: 'Missing appointment or user ID' });
    }

    const appointment = await appointmentModel.findOne({ _id: appointmentId, userId });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Update both fields to reflect COD selection
    appointment.payment = 'cod';
    appointment.codConfirmed = true; // ✅ Add this field in your schema if not present

    await appointment.save();

    return res.status(200).json({
      success: true,
      message: 'Payment method set to Cash on Delivery',
    });
  } catch (error) {
    console.error("Confirm COD Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


// Get Ultrasound services
export const getUltrasounds = async (req, res) => {
  try {
    // Fetch ultrasounds from the database
    const ultrasounds = await Ultrasound.find(); // your model
    
    // Check if data exists
    if (!ultrasounds || ultrasounds.length === 0) {
      return res.status(404).json({ success: false, message: "No ultrasound services found" });
    }

    res.json({ success: true, ultrasounds }); // Send the fetched data

  } catch (error) {
    console.error("Error fetching ultrasound services:", error);
    res.status(500).json({ success: false, message: "Error fetching ultrasound services" });
  }
};

// Get Blood Test services
export const getBloodTests = async (req, res) => {
  try {
    // Fetch blood tests from the database
    const bloodTests = await BloodTest.find(); // your model

    // Check if data exists
    if (!bloodTests || bloodTests.length === 0) {
      return res.status(404).json({ success: false, message: "No blood test services found" });
    }

    res.json({ success: true, bloodTests }); // Send the fetched data

  } catch (error) {
    console.error("Error fetching blood test services:", error);
    res.status(500).json({ success: false, message: "Error fetching blood test services" });
  }
};
export const addBloodTest = async (req, res) => {
  try {
    const { testName, price } = req.body;

    const newBloodTest = new BloodTest({ testName, price });
    await newBloodTest.save();

    res.status(201).json({ success: true, message: "Blood Test added successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
export const addUltrasound = async (req, res) => {
  try {
    const { testName, price } = req.body;

    const newUltrasound = new Ultrasound({ testName, price });
    await newUltrasound.save();

    res.status(201).json({ success: true, message: "Ultrasound added successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Book an appointment
// Book an appointment
export const bookTestAppointment = async (req, res) => {
  const { date, testId, testType, paymentMethod } = req.body;
  const userId = req.userId;

  if (!date || !testId || !testType || !paymentMethod || !userId) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields.',
    });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const newAppointment = new Booking({
      userId,
      testId,
      testType,
      date,
      paymentMethod,
      status: 'Pending',
    });

    await newAppointment.save();

    const sanitizedAppointment = {
      ...newAppointment.toObject(),
      userId: undefined,
    };

    // ✅ Send email to user
    await sendEmail({
      to: user.email,
      subject: 'Test Booking Confirmation',
      text: `Hello ${user.name},\n\nYou have successfully booked a ${testType} test on ${date}.\n\nThank you.`,
    });

    // ✅ Send email to admin
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: 'New Test Booking',
      text: `A new test has been booked:\n\nPatient Name: ${user.name}\nEmail: ${user.email}\nTest Type: ${testType}\nDate: ${date}\nPayment Method: ${paymentMethod}`,
    });

    return res.status(201).json({
      success: true,
      message: 'Appointment booked successfully!',
      appointment: sanitizedAppointment,
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    return res.status(500).json({
      success: false,
      message: 'Error booking appointment',
    });
  }
};


// Get Test Appointments

export const getTestAppointments = async (req, res) => {
  try {
    // ✅ Step 1: Extract user ID from authenticated request
    const userId = req.userId;

    // ✅ Step 2: Find bookings for this user
    const bookings = await Booking.find({ userId }).populate('testId');

    // ✅ Step 3: Send bookings to frontend
    res.status(200).json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error("Error fetching test appointments:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch test appointments',
    });
  }
};
// Cancel Test Appointment
export const cancelTestAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const userId = req.userId;

    const appointment = await Booking.findOne({ _id: appointmentId, userId });
    if (!appointment)
      return res.status(404).json({ success: false, message: 'Appointment not found' });

    appointment.cancelled = true; // ✅ Use the `cancelled` field
    await appointment.save();

    res.status(200).json({ success: true, message: 'Test appointment cancelled' });
  } catch (error) {
    console.error("Cancel Test Appointment Error:", error);
    res.status(500).json({ success: false, message: 'Error cancelling test appointment' });
  }
};
const client = new OAuth2Client('466877584558-mav87rfhumqa8g9ckr8u2dhcn2irtbsf.apps.googleusercontent.com');  // Your Google OAuth Client ID

export const googleLogin = async (req, res) => {
  const { token } = req.body;  // Token sent from frontend

  try {
    // Verify the token sent from frontend
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: '466877584558-mav87rfhumqa8g9ckr8u2dhcn2irtbsf.apps.googleusercontent.com', // Your Google Client ID
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name, email, image: picture });
    }

    const authToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({ success: true, token: authToken, user });
  } catch (error) {
    console.error('Error in Google login:', error);
    res.status(500).json({ success: false, message: 'Error logging in with Google' });
  }
};
export default {
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
  addBloodTest,       // <-- you missed this
  addUltrasound,  
  bookTestAppointment,
  getTestAppointments,
  cancelTestAppointment,
  googleLogin // <-- you missed this
};
