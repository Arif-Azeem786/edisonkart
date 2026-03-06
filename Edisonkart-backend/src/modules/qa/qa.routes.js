const express = require('express');
const router = express.Router();
const qaController = require('./qa.controller');
const { verifyToken } = require('../../middleware/auth.middleware');

router.get('/product/:productId', qaController.getByProduct);
router.post('/', verifyToken, qaController.askQuestion);
router.post('/:questionId/answer', verifyToken, qaController.answerQuestion);
router.post('/:questionId/answer/:answerId/helpful', verifyToken, qaController.markHelpful);

module.exports = router;
