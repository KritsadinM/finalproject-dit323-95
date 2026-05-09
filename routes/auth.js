/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Auth API
 */

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const pool = require('../db');

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fname:
 *                 type: string
 *               lname:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered
 */

router.post(
  '/register',
  [
    body('fname').isLength({ min: 1, max: 100 }),
    body('lname').isLength({ min: 1, max: 100 }),
    body('username').isLength({ min: 3, max: 50 }),
    body('email').isEmail(),
    body('password').isLength({ min: 8 })
  ],
  async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json(errors);
    }

    const {
      fname,
      lname,
      username,
      email,
      password
    } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    pool.query(
      `INSERT INTO users
      (fname, lname, username, email, password_hash)
      VALUES (?, ?, ?, ?, ?)`,
      [
        fname,
        lname,
        username,
        email,
        hashedPassword
      ],
      (err, result) => {

        if (err) {
          return res.status(500).json(err);
        }

        res.status(201).json({
          message: 'User registered'
        });

      }
    );

  }
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login success
 */

router.post('/login', (req, res) => {

  const {
    username,
    password
  } = req.body;

  pool.query(
    'SELECT * FROM users WHERE username=?',
    [username],
    async (err, results) => {

      if (err) {
        return res.status(500).json(err);
      }

      if (results.length === 0) {
        return res.status(401).json({
          message: 'Invalid username'
        });
      }

      const user = results[0];

      const match = await bcrypt.compare(
        password,
        user.password_hash
      );

      if (!match) {
        return res.status(401).json({
          message: 'Invalid password'
        });
      }

      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: user.role
        },
        process.env.JWT_SECRET,
        {
          expiresIn: '1d'
        }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      });

    }
  );

});

module.exports = router;