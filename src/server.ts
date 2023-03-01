import tst from 'trucksim-telemetry';

import express from 'express';

import cors from 'cors';

import http from 'http';

import { Server } from 'socket.io';

import { keyboard } from '@nut-tree/nut-js';

keyboard.config.autoDelayMs = 0;

const telemetry = tst();

const app = express();

const serverHttp = http.createServer(app);

const io = new Server(serverHttp);

io.disconnectSockets();

app.use(cors());
app.use(express.json());

io.on('connection', socket => {
  console.log(`${socket.id} connected.`);

  socket.on('ingame_command', key => {
    console.log(`${key} pressed`);

    keyboard.type(key);
  });
});

telemetry.watch({ interval: 25 }, ({ truck }) => {
  io.emit('speed_monitoring', truck.speed.kph);

  io.emit('status_hazard_light', truck.lights.hazard?.enabled);

  io.emit('differential_status', truck.differential.lock?.enabled);
});

app.get('/', (req, res) => {
  res.send({ message: 'Home' });
});

serverHttp.listen(3001, () => {
  console.log('ETS2 telemetry started 🚚');
});
