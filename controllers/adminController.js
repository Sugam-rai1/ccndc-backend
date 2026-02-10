import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import Doctor from '../models/doctorModel.js';
import jwt from 'jsonwebtoken';
import appointmentModel from '../models/appointmentModel.js';
import doctorModel from '../models/doctorModel.js';
import User from '../models/userModel.js';
import BloodTest from '../models/BloodTest.js';
import Ultrasound from '../models/Ultrasound.js';
import Booking from '../models/Booking.js';



// Add a new doctor
export const addDoctor = async (req, res) => {
  try {
    console.log('✅ Request received:', req.body);
    console.log('✅ Uploaded file:', req.file);

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image is required' });
    }

    const imagePath = req.file.path;  // Directly use the path provided by Multer
    console.log('📂 Image Path:', imagePath);
    console.log('📏 Image Size:', fs.statSync(imagePath).size);

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(imagePath);
    console.log('✅ Cloudinary Upload Result:', result);

    fs.unlinkSync(imagePath); // Delete local file after upload

    const newDoctor = new Doctor({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      speciality: req.body.speciality,
      degree: req.body.degree,
      experience: req.body.experience,
      about: req.body.about,
      fee: Number(req.body.fee),
      date: Number(req.body.date) || Date.now(),
      address: JSON.parse(req.body.address),
      image: result.secure_url,
      available: req.body.available !== undefined ? req.body.available : true,
      slots_booked: {},
    });

    await newDoctor.save();
    res.status(201).json({ success: true, doctor: newDoctor });
  } catch (error) {
    console.error('❌ Error in addDoctor:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin login
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign(
        { email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('❌ Error in loginAdmin:', error);
    res.json({ success: false, message: error.message });
  }
};

// Get all doctors
export const allDoctors = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select('-password');
    res.json({ success: true, doctors });
  } catch (error) {
    console.error('❌ Error in allDoctors:', error);
    res.json({ success: false, message: error.message });
  }
};

// Get all appointments
export const appointmentsAdmin = async (req, res) => {
  try {
    const appointments = await appointmentModel.find({});
    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Delete an appointment by ID

export const appointmentCancel = async (req, res) => {
  try {
    const {  appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);

    if (!appointmentData) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
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

export const adminDashboard = async (req,res) => {
  try {
    
    const doctors = await doctorModel.find({})
    const users = await User.find({})
    const appointments = await appointmentModel.find({})

    const dashData = {
      doctors: doctors.length,
      appointments: appointments.length,
      patients: users.length,
      lastestAppointments: appointments.reverse().slice(0,5)
    }
    res.json({success:true,dashData})

  } catch (error) {
    console.log(error)
    res.json({success: false,message: error.message})
  }
}
// userController.js

// ADD BLOOD TEST
export const addBloodTest = async (req, res) => {
  const { name, description, price } = req.body;
  try {
    const newBloodTest = new BloodTest({ name, description, price });
    await newBloodTest.save();
    res.status(201).json({ success: true, message: 'Blood test added successfully!', bloodTest: newBloodTest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to add blood test' });
  }
};

// GET ALL BLOOD TESTS
export const getAllBloodTests = async (req, res) => {
  try {
    const bloodTests = await BloodTest.find({});
    res.status(200).json({ success: true, bloodTests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch blood tests' });
  }
};

// UPDATE BLOOD TEST
export const updateBloodTest = async (req, res) => {
  const { id } = req.params; // ID comes from the route parameter
  const { name, description, price } = req.body; // Other data comes from the body
  try {
    const updatedBloodTest = await BloodTest.findByIdAndUpdate(
      id,
      { name, description, price },
      { new: true }
    );

    if (!updatedBloodTest) {
      return res.status(404).json({ message: 'Blood test not found' });
    }

    res.status(200).json({ message: 'Blood test updated successfully', bloodTest: updatedBloodTest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update blood test' });
  }
};


// DELETE BLOOD TEST
export const deleteBloodTest = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedBloodTest = await BloodTest.findByIdAndDelete(id);
    if (!deletedBloodTest) {
      return res.status(404).json({ message: 'Blood test not found' });
    }
    res.status(200).json({ message: 'Blood test deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete blood test' });
  }
};
export const deleteUltrasound = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedUltrasound = await Ultrasound.findByIdAndDelete(id);
    if (!deletedUltrasound) {
      return res.status(404).json({ message: 'Ultrasound not found' });
    }
    res.status(200).json({ message: 'Ultrasound deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete ultrasound' });
  }
};

// ================= ULTRASOUND APIs =================

// ADD ULTRASOUND
export const addUltrasound = async (req, res) => {
  const { name, description, price } = req.body;
  try {
    const newUltrasound = new Ultrasound({ name, description, price });
    await newUltrasound.save();
    res.status(201).json({ success: true, message: 'Ultrasound added successfully!', ultrasound: newUltrasound });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to add ultrasound' });
  }
};

// GET ALL ULTRASOUNDS
export const getAllUltrasounds = async (req, res) => {
  try {
    const ultrasounds = await Ultrasound.find({});
    res.status(200).json({ success: true, ultrasounds });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch ultrasounds' });
  }
};


export const updateUltrasound = async (req, res) => {
  const { id } = req.params; // ID comes from the route parameter
  const updatedData = req.body; // The rest of the data comes from the body

  try {
    const updatedUltrasound = await Ultrasound.findByIdAndUpdate(id, updatedData, { new: true });
    if (!updatedUltrasound) {
      return res.status(404).json({ error: 'Ultrasound not found' });
    }

    res.json({ message: 'Ultrasound updated successfully', ultrasound: updatedUltrasound });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update ultrasound' });
  }
};

export const getTestBookings = async (req, res) => {
  try {
    // Populate full user details including _id
    const bookings = await Booking.find({})
      .populate('userId', '_id name email'); // Add fields you may need

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'No bookings found' });
    }

    res.json({ success: true, bookings });
  } catch (error) {
    console.error('Error fetching test bookings:', error.message);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};




export  const cancelTestBooking = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({ success: false, message: 'Appointment ID is required' });
    }

    const appointment = await Booking.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.cancelled) {
      return res.status(400).json({ success: false, message: 'Appointment is already cancelled' });
    }

    appointment.cancelled = true;
    await appointment.save();

    res.json({ success: true, message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('Cancel appointment error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
export const markAppointmentCompleted = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointment = await Booking.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    appointment.isCompleted = true;
    await appointment.save();

    res.status(200).json({ success: true, message: 'Appointment marked as completed' });
  } catch (error) {
    console.error('Complete appointment error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete a doctor by ID
export const removeDoctor = async (req, res) => {
  const { id } = req.params;  // Get doctor ID from URL params

  try {
    // Find and delete the doctor
    const doctor = await doctorModel.findByIdAndDelete(id);

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    // If the doctor has a profile image in Cloudinary, delete it as well
    if (doctor.image) {
      const publicId = doctor.image.split('/').pop().split('.')[0]; // Extract the public ID from the image URL
      await cloudinary.uploader.destroy(publicId); // Remove the image from Cloudinary
    }

    // Respond with success
    res.status(200).json({ success: true, message: 'Doctor removed successfully' });
  } catch (error) {
    console.error('❌ Error in removeDoctor:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
