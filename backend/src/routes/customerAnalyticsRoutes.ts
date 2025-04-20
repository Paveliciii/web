import express from 'express'; const router = express.Router(); router.get('/', (req, res) => { res.json({ message: 'Customer analytics endpoint working!' }); }); export default router;
