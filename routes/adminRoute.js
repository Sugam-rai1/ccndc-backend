import express from 'express';
import { addDoctor, allDoctors, loginAdmin, appointmentsAdmin, appointmentCancel, adminDashboard, updateBloodTest, updateUltrasound, deleteBloodTest, deleteUltrasound,getAllBloodTests, getAllUltrasounds, getTestBookings,  cancelTestBooking, markAppointmentCompleted, removeDoctor } from '../controllers/adminController.js';
import upload from '../middleware/multer.js';
import authAdmin from '../middleware/authAdmin.js';
import { changeAvailability } from '../controllers/doctorController.js';
import { addBloodTest as addUserBloodTest, addUltrasound as addUserUltrasound } from '../controllers/adminController.js';
import BloodTest from '../models/BloodTest.js';
import Ultrasound from '../models/Ultrasound.js';




const adminRouter = express.Router();

// Route to add a doctor
adminRouter.post('/add-doctor', authAdmin, upload.single('image'), addDoctor);

// Route for admin login
adminRouter.post('/login', loginAdmin);

// Route to get all doctors
adminRouter.post('/all-doctors', authAdmin, allDoctors);

// Route to change doctor availability
adminRouter.post('/change-availability', authAdmin, changeAvailability);

// Route to get all appointments
adminRouter.get('/appointments', authAdmin, appointmentsAdmin);

// Route to cancel appointment
adminRouter.post('/cancel-appointment', authAdmin, appointmentCancel);

// Route to get admin dashboard details
adminRouter.get('/dashboard', authAdmin, adminDashboard);

// Route to add a blood test
adminRouter.post('/add-blood-test', authAdmin, addUserBloodTest);

// Route to add an ultrasound
adminRouter.post('/add-ultrasound', authAdmin, addUserUltrasound);

// Route to update a blood test
adminRouter.put('/update-blood-test/:id', authAdmin, updateBloodTest);

// Route to update an ultrasound
// Route to update an ultrasound
adminRouter.put('/update-ultrasound/:id', authAdmin, updateUltrasound);


// Route to delete a blood test
adminRouter.delete('/delete-blood-test/:id', authAdmin, deleteBloodTest);

// Route to delete an ultrasound
adminRouter.delete('/delete-ultrasound/:id', authAdmin, deleteUltrasound);
// Route to get all blood tests
adminRouter.get('/all-blood-tests', authAdmin, async (req, res) => {
  try {
    const bloodTests = await BloodTest.find(); // assuming you have a model for BloodTest
    res.json(bloodTests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch blood tests' });
  }
});

// Route to get all ultrasounds
adminRouter.get('/all-ultrasounds', authAdmin, async (req, res) => {
  try {
    const ultrasounds = await Ultrasound.find(); // assuming you have a model for Ultrasound
    res.json(ultrasounds);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ultrasounds' });
  }
});
// Add routes for fetching services
// Route to get all blood tests (use /blood-tests to keep it simple)
adminRouter.get('/blood-tests', authAdmin, async (req, res) => {
  try {
    const bloodTests = await BloodTest.find();
    res.json({ success: true, bloodTests });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch blood tests' });
  }
});

// Route to get all ultrasounds
adminRouter.get('/ultrasounds', authAdmin, async (req, res) => {
  try {
    const ultrasounds = await Ultrasound.find();
    res.json({ success: true, ultrasounds });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch ultrasounds' });
  }
});

adminRouter.get('/test-bookings', authAdmin, getTestBookings);
adminRouter.post('/cancel-test-booking', authAdmin, cancelTestBooking);
adminRouter.post('/complete-appointment', authAdmin, markAppointmentCompleted);
// Route to remove a doctor by ID
adminRouter.delete('/remove-doctor/:id', authAdmin, removeDoctor);

export default adminRouter;
