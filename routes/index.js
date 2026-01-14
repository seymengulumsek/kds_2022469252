const express = require('express');
const router = express.Router();


const uretimRoutes = require('./uretimRoutes');
const tedarikciRoutes = require('./tedarikciRoutes');
const kaynakRoutes = require('./kaynakRoutes');
const lojistikRoutes = require('./lojistikRoutes');
const dashboardRoutes = require('./dashboardRoutes');


router.use('/uretim', uretimRoutes);
router.use('/tedarikci', tedarikciRoutes);
router.use('/kaynak', kaynakRoutes);
router.use('/lojistik', lojistikRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
