import tst from 'trucksim-telemetry';

import express from 'express';

import cors from 'cors';

import http from 'http';

import { Server } from 'socket.io';

import { keyboard } from '@nut-tree/nut-js';

interface TelemetryInfo {
  truckSpeed: number;
  currentFuel: number;
  totalFuel: number;

  hazardLight?: boolean;
  cruizeControl: boolean;
  highLight: boolean;
  engineBreak: boolean;

  differential?: boolean;
  light: boolean;
  retarderStatus: number;

  currentMaxSpeed: number;
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

let lastSpeedLimit = MIN_SPEED;

telemetry.watch({ interval: 50 });

telemetry.truck.on('hazard', () => {
  console.log('hazard');

  io.emit('hazard_light', telemetry.getTruck().lights.hazard?.enabled || false);
});

telemetry.truck.on('speed', () => {
  io.emit('speed', telemetry.getTruck().speed.kph);
});

// telemetry.watch({ interval: 25 }, ({ truck, navigation }) => {
//   const currentSpeedLimit = navigation.speedLimit.kph;

//   lastSpeedLimit = currentSpeedLimit >= 30 ? currentSpeedLimit : lastSpeedLimit;

//   const speedLimit =
//     currentSpeedLimit >= 30 ? currentSpeedLimit : lastSpeedLimit;

//   // const apiTelemetry: TelemetryInfo = {
//   //   truckSpeed: truck.speed.kph,
//   //   currentFuel: truck.fuel.value,
//   //   totalFuel: truck.fuel.capacity,

//   //   hazardLight: truck.lights.hazard?.enabled,
//   //   cruizeControl: truck.cruiseControl.enabled,
//   //   highLight: truck.lights.beamHigh.enabled,
//   //   engineBreak: truck.brakes.motor.enabled,

//   //   differential: truck.differential.lock?.enabled,
//   //   light: truck.lights.beacon.enabled,
//   //   retarderStatus: truck.brakes.retarder.steps,

//   //   currentMaxSpeed: navigation.speedLimit.kph,
//   // };

//   io.emit('speed', truck.speed.kph);

//   io.emit('speed_limit', speedLimit);
// });

app.get('/', (req, res) => {
  res.send({ message: 'Wellcome to temeltry ets api' });
});

serverHttp.listen(3001, () => {
  console.log('ETS2 telemetry started 🚚');
});
