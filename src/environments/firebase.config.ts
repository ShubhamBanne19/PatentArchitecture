import { FirebaseOptions } from 'firebase/app';

/**
 * Firebase Web SDK config.
 *
 * These values are public by design: they ship inside the JS bundle of every
 * deployed build and identify the project, they don't grant access. All access
 * control lives in firestore.rules and Firebase Auth. This file is committed so
 * that CI and fresh clones build without any extra setup.
 *
 * Values come from: Firebase Console -> Project Settings -> General -> Web app.
 */
export const firebaseConfig: FirebaseOptions = {
  apiKey: 'AIzaSyDgBkCsyEix58TqijFQ9RFx-CQLcta3Lus',
  authDomain: 'patent-architect.firebaseapp.com',
  projectId: 'patent-architect',
  storageBucket: 'patent-architect.firebasestorage.app',
  messagingSenderId: '318772125486',
  appId: '1:318772125486:web:8d06a6077c1a095d1724bf',
  measurementId: 'G-FCJMW4P1PH',
};
