import mqtt from 'mqtt';

console.log('MQTT Host:', import.meta.env.VITE_MQTT_HOST);
console.log('MQTT User:', import.meta.env.VITE_MQTT_USER);

const options = {
  protocol: 'wss',
  clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
  username: import.meta.env.VITE_MQTT_USER,
  password: import.meta.env.VITE_MQTT_PASS,
  connectTimeout: 4000,
};

const client = mqtt.connect(`wss://${import.meta.env.VITE_MQTT_HOST}:8884/mqtt`, options);

export default client;