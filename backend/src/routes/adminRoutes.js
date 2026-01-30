const express = require('express');
const router = express.Router();
const { 
  createReport, getReports, updateReport, deleteReport,
  getAllHistory, updateHistory, deleteHistory 
} = require('../controllers/adminController');

router.post('/reports', createReport); 
router.get('/reports', getReports);
router.put('/reports/:id', updateReport);
router.delete('/reports/:id', deleteReport);

router.get('/history', getAllHistory);
router.put('/history/:id', updateHistory);
router.delete('/history/:id', deleteHistory);

module.exports = router;