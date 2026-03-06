'use strict';

require('./config/env');

const app            = require('./app');
const connectPostgres = require('./config/postgres');
const connectMongo   = require('./config/mongodb');
const { PORT }       = require('./config/env');

async function bootstrap() {
    try {
        await connectPostgres();
        console.log('PostgreSQL connected');

        await connectMongo();
        console.log('MongoDB connected');

        app.listen(PORT, () => {
            console.log(`MegaStore API http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Startup error:', err.message);
        process.exit(1);
    }
}

bootstrap();
