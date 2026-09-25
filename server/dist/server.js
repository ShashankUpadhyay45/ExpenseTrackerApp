import app from './app.js';
import { connectDB } from './config/database.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
const startServer = async () => {
    await connectDB();
    const server = app.listen(config.PORT, () => {
        logger.info(`Server running in ${config.NODE_ENV} mode on port ${config.PORT}`);
    });
    process.on('unhandledRejection', (err) => {
        logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
        logger.error(err.name, err.message);
        server.close(() => {
            process.exit(1);
        });
    });
    process.on('SIGTERM', () => {
        logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
        server.close(() => {
            logger.info('💥 Process terminated!');
        });
    });
};
startServer();
