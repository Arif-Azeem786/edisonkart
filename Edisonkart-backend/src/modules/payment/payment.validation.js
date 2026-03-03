const Joi = require('joi');

const getPaymentsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  status: Joi.string().valid('PENDING', 'SUCCESS', 'FAILED'),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().min(Joi.ref('startDate'))
});

const statsQuerySchema = Joi.object({
  period: Joi.string().valid('day', 'week', 'month', 'year')
});

module.exports = {
  getPaymentsQuerySchema,
  statsQuerySchema
};