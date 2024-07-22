import sequelize from './shared/database/database.js';
import { usersRouter } from "./users/router.js";
import express from 'express';

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use('/api/users', usersRouter);

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

const startServer = async () => {
  try {
    await sequelize.sync({ force: true });
    console.log('db is ready');
    const server = app.listen(PORT, () => {
      console.log('Server running on port', PORT);
    });
    return server;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app, startServer };