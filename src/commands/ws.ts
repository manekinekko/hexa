import WebSocket from 'ws';
import { processWebSocketRequest, sendWebSocketResponse } from '../features/thunderstorm/index';

export default async function () {
  const wss = new WebSocket.Server({ host: '0.0.0.0', port: 8080 })

  wss.on('listening', () => {
    console.log('Listening on ws://0.0.0.0:8080')
  });

  wss.on('connection', async ws => {

    ws.on('message', async message => {
      try {
        processWebSocketRequest(ws, message);
      }
      catch (error) {
        sendWebSocketResponse(ws, error.message, 500);
      }
    });
  });

  wss.on('error', (error: any) => {
    console.log(`Error => ${error}`)
  });

  wss.on('close', () => {
    console.log('Connection closed')
  });

  wss.on('open', () => {
    console.log('Connection open')
  });

  wss.on('closing', (code, reason) => {
    console.log(`Closing with code ${code} and reason ${reason}`)
  });

  wss.on('reopen', () => {
    console.log('Reopening')
  });

}

