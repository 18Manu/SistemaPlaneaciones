import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
  try {
    // Verificar que MONGODB_URI esté definida
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI no está definida en las variables de entorno');
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(` MongoDB Conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(' Error al conectar MongoDB:', error.message);
    process.exit(1);
  }
};

//Agregar el singleton de los patrones d ediseño