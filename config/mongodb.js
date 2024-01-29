const dotenv = require("dotenv");
const mongoose = require("mongoose");
// const path = require('path');

// Load environment variables
dotenv.config();
// dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DB_STRING;
//console.log( connectionString);

const connectToDB = async () => {
  try {
    await mongoose.connect(connectionString, {
  
        autoIndex: true
    });
    //console.log('Connected to MongoDB');
  } catch (error) {
    console.error(error);
  }
};

// Call the function to connect to the database
module.exports = connectToDB
// connectToDB()

