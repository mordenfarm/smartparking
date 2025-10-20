import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';

const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'admin123'; // Firebase requires at least 6 characters
const ADMIN_SETUP_FLAG = 'smartpark_admin_created';

export const createDefaultAdmin = async () => {
  // Check if the setup has already run to avoid errors
  if (localStorage.getItem(ADMIN_SETUP_FLAG)) {
    return;
  }

  try {
    await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('Default admin user created successfully.');
  } catch (error: any) {
    // If the user already exists, we can safely ignore the error.
    if (error.code === 'auth/email-already-in-use') {
      console.log('Admin user already exists.');
    } else {
      console.error('Error creating default admin user:', error);
    }
  } finally {
    // Set the flag so this process doesn't run again on subsequent visits
    localStorage.setItem(ADMIN_SETUP_FLAG, 'true');
  }
};
