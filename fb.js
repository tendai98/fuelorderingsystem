const firebase = require("firebase")

const firebaseConfig = {
  apiKey: "AIzaSyDt3M0v8ZvLjlGT8yOrb0ny8zHRnfKYpQo",
  authDomain: "fuel-ordering-system.firebaseapp.com",
  projectId: "fuel-ordering-system",
  storageBucket: "fuel-ordering-system.appspot.com",
  messagingSenderId: "869170917646",
  appId: "1:869170917646:web:f02303fa5eeba43483275f"
};

const app = firebase.initializeApp(firebaseConfig);

module.exports = app