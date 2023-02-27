import tst from 'trucksim-telemetry';

import robot from 'robotjs';

import express from 'express';

import cors from 'cors';

import http from 'http';

import { Server } from 'socket.io';

type RequirimentKey = {
  key: string;
};

const telemetry = tst();

const app = express();

const serverHttp = http.createServer(app);

const io = new Server(serverHttp);

app.use(cors());
app.use(express.json());

io.on('connection', socket => {
  console.log(`${socket.id} connected.`);
});

telemetry.watch({ interval: 25 }, () => {
  io.emit('speed_monitoring', telemetry.getTruck().speed.kph);

  io.emit('status_hazard_light', telemetry.getTruck().lights.hazard?.enabled);

  io.emit(
    'differential_status',
    telemetry.getTruck().differential.lock?.enabled,
  );
});

app.get('/', (req, res) => {
  res.send({ message: 'Home' });
});

app.post('/key_press', async (req, res) => {
  const { key }: RequirimentKey = req.body;

  console.log('Required key press ' + key);

  robot.keyTap(key);
});

serverHttp.listen(3001, () => {
  console.log('ETS2 telemetry started 🚚');
});
