const express = require('express');
const connectDB = require('./config/database');

const app = express();

// Connect Database
connectDB();

// Init Middleware
app.use(express.json({ extended: false }));

// Define Routes
app.use('/signup', require('./routes/auth'));
app.use('/login', require('./routes/auth'));
app.use('/user', require('./routes/user'));
app.use('/borrow', require('./routes/borrow'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
