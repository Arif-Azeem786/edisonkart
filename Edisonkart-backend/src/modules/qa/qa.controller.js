const Question = require('./qa.model');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');

const qaController = {
  async getByProduct(req, res, next) {
    try {
      const { productId } = req.params;
      const questions = await Question.find({ productId })
        .sort({ createdAt: -1 })
        .populate('userId', 'name')
        .populate('answers.userId', 'name role')
        .lean();
      successResponse(res, questions);
    } catch (error) {
      next(error);
    }
  },

  async askQuestion(req, res, next) {
    try {
      const { productId, text } = req.body;
      if (!productId || !text?.trim()) return errorResponse(res, 'Product ID and question text are required', 400);

      const question = await Question.create({
        productId,
        userId: req.user.userId,
        text: text.trim(),
      });
      successResponse(res, question, 'Question posted', 201);
    } catch (error) {
      next(error);
    }
  },

  async answerQuestion(req, res, next) {
    try {
      const { questionId } = req.params;
      const { text } = req.body;
      if (!text?.trim()) return errorResponse(res, 'Answer text is required', 400);

      const question = await Question.findById(questionId);
      if (!question) return errorResponse(res, 'Question not found', 404);

      question.answers.push({ userId: req.user.userId, text: text.trim() });
      await question.save();
      successResponse(res, question, 'Answer posted');
    } catch (error) {
      next(error);
    }
  },

  async markHelpful(req, res, next) {
    try {
      const { questionId, answerId } = req.params;
      const question = await Question.findById(questionId);
      if (!question) return errorResponse(res, 'Question not found', 404);
      const answer = question.answers.id(answerId);
      if (!answer) return errorResponse(res, 'Answer not found', 404);
      answer.helpful += 1;
      await question.save();
      successResponse(res, null, 'Marked as helpful');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = qaController;
