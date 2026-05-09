require('dotenv').config();

const express = require('express');
const cors = require('cors');

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger/swagger');

const authRoutes = require('./routes/auth');
const movieRoutes = require('./routes/movies');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/movies', movieRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/', (req, res) => {
  res.json({
    message: 'Movie Ticket Booking API'
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});