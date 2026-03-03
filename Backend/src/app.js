const express = require('express');
const cors = require('cors');
const rolesRouter = require('./routers/roles.router');
const usersRouter = require('./routers/users.router');

const app = express();

app.use(cors());
app.use(express.json());
app.get('/', (req, res) => {
	res.status(200).json({ message: 'Backend is running' });
});
app.use('/api/roles', rolesRouter);
app.use('/api/users', usersRouter);

module.exports = app;