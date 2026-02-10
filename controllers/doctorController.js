import doctorModel from '../models/doctorModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import appointmentModel from '../models/appointmentModel.js';

// API for changing availability
export const changeAvailability = async (req, res) => {
  try {
    const { docId } = req.body;

    const docData = await doctorModel.findById(docId);
    if (!docData) {
      return res.json({ success: false, message: "Doctor not found." });
    }

    await doctorModel.findByIdAndUpdate(docId, { available: !docData.available });

    res.json({ success: true, message: "Availability changed successfully." });
  } catch (error) {
    console.log("Error changing availability:", error);
    res.json({ success: false, message: "Error changing availability: " + error.message });
  }
};

// API for getting the doctor list
export const doctorList = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select(['-password', '-email']);
    if (!doctors || doctors.length === 0) {
      return res.status(404).json({ success: false, message: "No doctors found." });
    }
    res.json({ success: true, doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch doctors. " + error.message });
  }
};

// API for doctor login
export const doctorLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const doctor = await doctorModel.findOne({ email });
    if (!doctor) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isHashed = doctor.password.startsWith("$2b$");
    if (!isHashed) {
      const hashed = await bcrypt.hash(doctor.password, 10);
      doctor.password = hashed;
      await doctor.save();
    }

    const updatedDoctor = await doctorModel.findOne({ email });
    const isMatch = await bcrypt.compare(password, updatedDoctor.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: updatedDoctor._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      doctor: {
        id: updatedDoctor._id,
        name: updatedDoctor.name,
        email: updatedDoctor.email,
        image: updatedDoctor.image,
        speciality: updatedDoctor.speciality,
        available: updatedDoctor.available,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Login failed: " + error.message });
  }
};

// API to get appointments for the doctor
export const appointmentsDoctor = async (req, res) => {
  try {
    const { docId } = req.user; // ✅ From authDoctor middleware
    console.log("✅ appointmentsDoctor route hit with docId:", docId);

    const appointments = await appointmentModel.find({ docId });

    if (!appointments || appointments.length === 0) {
      return res.status(404).json({ success: false, message: "No appointments found." });
    }

    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: "Appointments fetch error: " + error.message });
  }
};

// API to mark appointment as completed
export const appointmentComplete = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const { docId } = req.user; // ✅ Consistent use

    const appointmentData = await appointmentModel.findById(appointmentId);
    if (appointmentData && appointmentData.docId.toString() === docId.toString()) {
      await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true });
      return res.json({ success: true, message: 'Appointment completed' });
    } else {
      return res.json({ success: false, message: 'Marking as complete failed' });
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to cancel appointment
export const appointmentCancel = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const { docId } = req.user; // ✅ Consistent use

    const appointmentData = await appointmentModel.findById(appointmentId);
    if (appointmentData && appointmentData.docId.toString() === docId.toString()) {
      await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });
      return res.json({ success: true, message: 'Appointment canceled' });
    } else {
      return res.json({ success: false, message: 'Cancellation failed' });
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};


//API to get doctor panel

export const doctorDashboard = async (req, res) => {
  try {
    const { docId } = req.user;  // Get docId from the authenticated user
    const appointments = await appointmentModel.find({ docId });

    let earnings = 0;
    appointments.forEach((item) => {
      if (item.isCompleted || item.payment) {
        earnings += item.amount;
      }
    });

    let patients = [];
    appointments.forEach((item) => {
      if (!patients.includes(item.userId)) {
        patients.push(item.userId);
      }
    });

    const latestAppointments = [...appointments].reverse().slice(0, 5);

    const dashData = {
      earnings,
      appointments: appointments.length,
      patients: patients.length,
      latestAppointments
    };

    res.json({ success: true, dashData });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Api to get doctorProfile for doctor panel
export const doctorProfile = async (req, res) => {
  try {
    const { docId } = req.user;

    // Fetch doctor data excluding password
    const profileData = await doctorModel.findById(docId).select('-password');
    
    // Check if profile exists
    if (!profileData) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    res.json({ success: true, profileData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// API to update doctor profile data
export const updateDoctorProfile = async (req, res) => {
  try {
    const { docId, fee, address, available, name, degree, speciality, about } = req.body;

    // Ensure all required data is provided
    if (!docId || !fee || !address || typeof available !== 'boolean') {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Find the doctor by ID and update their profile
    const updatedProfile = await doctorModel.findByIdAndUpdate(
      docId,
      {
        fee,
        address,
        available,
        name,
        degree,
        speciality,
        about,
      },
      { new: true } // Return the updated document
    );

    // Check if doctor was found
    if (!updatedProfile) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    res.json({ success: true, message: 'Profile Updated', updatedProfile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};