git// Express backend for the DEV@Deakin newsletter sign-up feature.
// This is the P2 backend carried over, updated to talk to a separate
// React frontend (different port), so it now needs CORS enabled.
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');
const { z } = require('zod');

const app = express();

app.use(express.json());
// frontend runs on a different port (Vite, usually 5173) to this
// backend (3000) - without cors(), the browser blocks the request
app.use(cors());

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const subscribers = [];

// same idea as the Zod schemas on the frontend - checking the shape
// of the request body before doing anything with it
const subscribeSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
});

app.post('/subscribe', async (req, res) => {
  // validate first - if the body doesn't match, don't even try Firestore/SendGrid
  const result = subscribeSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: result.error.issues[0].message });
  }

  const { email } = result.data;
  subscribers.push(email);

  const msg = {
    to: email,
    from: process.env.SENDER_EMAIL,
    subject: 'Welcome to DEV@Deakin!',
    text: 'Thanks for subscribing to DEV@Deakin updates!',
    html: '<strong>Thanks for subscribing to DEV@Deakin updates!</strong><p>We will keep you posted on new projects and updates.</p>',
  };

  try {
    const response = await sgMail.send(msg);
    console.log('Email sent. SendGrid status code:', response[0].statusCode);
    res.status(202).json({ message: 'Subscribed successfully! Check your inbox.' });
  } catch (error) {
    console.error('SendGrid error:', error.response ? error.response.body : error.message);
    res.status(500).json({ message: 'Something went wrong sending the email. Please try again later.' });
  }
});

app.get('/', (req, res) => {
  res.send('DEV@Deakin backend is running.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
