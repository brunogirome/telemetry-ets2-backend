import tst from 'trucksim-telemetry';

import express from 'express';

import cors from 'cors';

import http from 'http';

import { Server } from 'socket.io';

import { keyboard } from '@nut-tree/nut-js';

interface Speed {
  kph: number;
}

interface CruiseControl {
  enabled: boolean;
}

keyboard.config.autoDelayMs = 0;

const MIN_SPEED = 10;

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

function configureBooleanEmmiter(key: string) {
  telemetry.truck.on(key, (status: boolean) => {
    console.log(`${key} status: ${status}`);

    io.emit(key, status || false);
  });
}

function configureNumberEmmiter(key: string) {
  telemetry.truck.on(key, (value: number) => {
    io.emit(key, Math.round(value));
  });
}

telemetry.watch({ interval: 100 });

configureBooleanEmmiter('hazard');

configureBooleanEmmiter('cruise-control');

telemetry.truck.on('cruise-control', ({ enabled }: CruiseControl) => {
  console.log(`cruise-control status: ${enabled}`);

  io.emit('cruise-control', enabled || false);
});

configureBooleanEmmiter('high-beam');

configureBooleanEmmiter('engine-break');

configureBooleanEmmiter('differential');

configureBooleanEmmiter('low-beam');

configureBooleanEmmiter('park');

telemetry.truck.on('speed', ({ kph }: Speed) => {
  const speed = kph > 0 ? kph : 0;

  io.emit('speed', speed);
});

let lastSpeedLimit = MIN_SPEED;

telemetry.navigation.on('speed-limit', ({ kph: currentSpeedLimit }: Speed) => {
  lastSpeedLimit =
    currentSpeedLimit > MIN_SPEED ? currentSpeedLimit : lastSpeedLimit;

  const speedLimit =
    currentSpeedLimit > MIN_SPEED ? currentSpeedLimit : lastSpeedLimit;

  console.log(`speed limit: ${speedLimit}`);

  io.emit('speed-limit', speedLimit);
});

configureNumberEmmiter('fuel-value');

configureNumberEmmiter('fuel-capacity');

app.get('/', (req, res) => {
  res.send({ message: 'Wellcome to temeltry ets api' });
});

serverHttp.listen(3001, () => {
  console.log('ETS2 telemetry started 🚚');
});
