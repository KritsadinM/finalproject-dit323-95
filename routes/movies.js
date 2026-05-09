const express = require('express');
const pool = require('../db');

const auth = require('../middleware/authMiddleware');

const {
  body,
  validationResult
} = require('express-validator');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Movies
 *   description: Movie management API
 */

/**
 * @swagger
 * /movies:
 *   get:
 *     summary: Get all movies
 *     tags: [Movies]
 *     responses:
 *       200:
 *         description: Success
 */

router.get('/', (req, res) => {

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';

  const offset = (page - 1) * limit;

  pool.query(
    'SELECT COUNT(*) AS total FROM movies WHERE title LIKE ?',
    [`%${search}%`],
    (err, countResult) => {

      if (err) {
        return res.status(500).json(err);
      }

      const total = countResult[0].total;

      pool.query(
        `SELECT * FROM movies
         WHERE title LIKE ?
         LIMIT ? OFFSET ?`,
        [`%${search}%`, limit, offset],
        (err, results) => {

          if (err) {
            return res.status(500).json(err);
          }

          res.json({
            page,
            limit,
            total,
            data: results
          });

        }
      );

    }
  );

});

/**
 * @swagger
 * /movies/{id}:
 *   get:
 *     summary: Get movie by ID
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Movie not found
 */

router.get('/:id', (req, res) => {

  pool.query(
    'SELECT * FROM movies WHERE id=?',
    [req.params.id],
    (err, results) => {

      if (err) {
        return res.status(500).json(err);
      }

      if (results.length === 0) {
        return res.status(404).json({
          message: 'Movie not found'
        });
      }

      res.json(results[0]);

    }
  );

});

/**
 * @swagger
 * /movies:
 *   post:
 *     summary: Create movie
 *     tags: [Movies]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               director:
 *                 type: string
 *               genre:
 *                 type: string
 *               duration:
 *                 type: integer
 *               release_date:
 *                 type: string
 *               rating:
 *                 type: number
 *     responses:
 *       201:
 *         description: Movie created
 */

router.post(
  '/',
  auth,
  [
    body('title').notEmpty(),
    body('director').notEmpty(),
    body('genre').notEmpty(),
    body('duration').isInt({ min: 1 }),
    body('rating').isFloat({ min: 0, max: 10 })
  ],
  (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json(errors);
    }

    const {
      title,
      director,
      genre,
      duration,
      release_date,
      rating,
      poster_url,
      description
    } = req.body;

    pool.query(
      `INSERT INTO movies
      (title, director, genre, duration,
      release_date, rating, poster_url, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        director,
        genre,
        duration,
        release_date,
        rating,
        poster_url,
        description
      ],
      (err, result) => {

        if (err) {
          return res.status(500).json(err);
        }

        res.status(201).json({
          message: 'Movie created'
        });

      }
    );

  }
);

/**
 * @swagger
 * /movies/{id}:
 *   put:
 *     summary: Update movie
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               director:
 *                 type: string
 *               genre:
 *                 type: string
 *               duration:
 *                 type: integer
 *               release_date:
 *                 type: string
 *               rating:
 *                 type: number
 *               poster_url:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Movie updated
 */

router.put('/:id', auth, (req, res) => {

  pool.query(
    'SELECT * FROM movies WHERE id=?',
    [req.params.id],
    (err, results) => {

      if (err) {
        return res.status(500).json(err);
      }

      if (results.length === 0) {
        return res.status(404).json({
          message: 'Movie not found'
        });
      }

      const movie = results[0];

      const updatedMovie = {
        title: req.body.title || movie.title,
        director: req.body.director || movie.director,
        genre: req.body.genre || movie.genre,
        duration: req.body.duration || movie.duration,
        release_date: req.body.release_date || movie.release_date,
        rating: req.body.rating || movie.rating,
        poster_url: req.body.poster_url || movie.poster_url,
        description: req.body.description || movie.description
      };

      pool.query(
        `UPDATE movies SET
        title=?,
        director=?,
        genre=?,
        duration=?,
        release_date=?,
        rating=?,
        poster_url=?,
        description=?
        WHERE id=?`,
        [
          updatedMovie.title,
          updatedMovie.director,
          updatedMovie.genre,
          updatedMovie.duration,
          updatedMovie.release_date,
          updatedMovie.rating,
          updatedMovie.poster_url,
          updatedMovie.description,
          req.params.id
        ],
        (err, result) => {

          if (err) {
            return res.status(500).json(err);
          }

          res.json({
            message: 'Movie updated successfully'
          });

        }
      );

    }
  );

});

/**
 * @swagger
 * /movies/{id}:
 *   delete:
 *     summary: Delete movie
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Movie deleted
 */

router.delete('/:id', auth, (req, res) => {

  pool.query(
    'DELETE FROM movies WHERE id=?',
    [req.params.id],
    (err, result) => {

      if (err) {
        return res.status(500).json(err);
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: 'Movie not found'
        });
      }

      res.json({
        message: 'Movie deleted'
      });

    }
  );

});

module.exports = router;