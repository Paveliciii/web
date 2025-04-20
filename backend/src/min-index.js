const express = require('express'); const app = express(); app.use('/api/customer-analytics', require('./routes/customersAnalyticsRoutes')); app.listen(3001);
