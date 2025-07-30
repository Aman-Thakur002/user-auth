/**
 * Module dependencies.
**/
import app from '../app';
import http from 'http';
const { sequelize } = require('../models')

const debug = require('debug')('server:debug');

/**
 * Get port from environment and store in Express.
**/
const port = normalizePort(process.env.PORT || 4000);
app.set('port', port);

/**
 * Create HTTP server.
**/
const server = http.createServer(app);

/**
 * Listen on provided port.
**/

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
**/

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

async function onListening() {

  try {
    await sequelize.authenticate()
    console.log('Database Connected')
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  console.log('App is Listening on ' + bind);
}
