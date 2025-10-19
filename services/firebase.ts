import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyBGAiw7InabqWQTzxE00wj3DD8ov3Fla_Q",
  authDomain: "smatpark-9c5dc.firebaseapp.com",
  databaseURL: "https://smatpark-9c5dc-default-rtdb.firebaseio.com",
  projectId: "smatpark-9c5dc",
  storageBucket: "smatpark-9c5dc.appspot.com",
  messagingSenderId: "63579930759",
  appId: "1:63579930759:web:e2db504ff5169cd00bb822"
};


const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app);
