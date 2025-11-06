import mongoose from 'mongoose';
import dotenv from 'dotenv';
import EventEmitter from 'events'; 

dotenv.config();


let connection = null;


export const dbEvents = new EventEmitter();


export const connectDB = async () => {
  try {
    if (connection) {
      console.log(' Reutilizando conexión existente a MongoDB');
      return connection;
    }

    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI no está definida en las variables de entorno');
    }

    //  Crear la conexión una sola vez
    connection = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(` MongoDB conectado: ${connection.connection.host}`);

    //  Emitir evento “connected”
    dbEvents.emit('connected', connection.connection.host);

    //  Escuchar eventos internos de Mongoose
    mongoose.connection.on('disconnected', () => {
      console.warn(' MongoDB desconectado');
      dbEvents.emit('disconnected');
    });

    mongoose.connection.on('error', (err) => {
      console.error(' Error en MongoDB:', err.message);
      dbEvents.emit('error', err);
    });

    return connection;
  } catch (error) {
    console.error(' Error al conectar MongoDB:', error.message);
    dbEvents.emit('error', error); // Notificar el error
    process.exit(1);
  }
};
