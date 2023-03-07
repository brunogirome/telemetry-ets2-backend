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

interface TelemetryInitialization {
  hazard: boolean;
  cruiseControl: boolean;
  highlight: boolean;
  engineBreak: boolean;
  differential: boolean;
  light: boolean;
  parking: boolean;

  maxSpeed: number;
  currentSpeed: number;

  currentFuel: number;
  fuelCapacity: number;
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

telemetry.watch({ interval: 100 });

io.on('connection', socket => {
  console.log(`${socket.id} connected.`);

  const { lights, cruiseControl, brakes, differential, speed, fuel } =
    telemetry.getTruck();

  const { speedLimit } = telemetry.getNavigation();

  const telemetryInitialization: TelemetryInitialization = {
    hazard: lights.hazard?.enabled || false,
    cruiseControl: cruiseControl.enabled,
    highlight: lights.beamHigh.enabled,
    engineBreak: brakes.motor.enabled,
    differential: differential.lock?.enabled || false,
    light: lights.beamLow.enabled,
    parking: brakes.parking.enabled,

    maxSpeed: speedLimit.kph,
    currentSpeed: speed.kph,

    currentFuel: Math.round(fuel.value),
    fuelCapacity: Math.round(fuel.capacity),
  };

  socket.emit('telemetry-initialization', telemetryInitialization);

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
