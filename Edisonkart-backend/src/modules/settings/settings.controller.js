const Settings = require('./settings.model');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');

const DEFAULTS = {
  codEnabled: false,
  freeShipping: true,
};

const settingsController = {
  async getPublic(req, res, next) {
    try {
      const codEnabled = await Settings.get('codEnabled', DEFAULTS.codEnabled);
      const freeShipping = await Settings.get('freeShipping', DEFAULTS.freeShipping);
      return successResponse(res, { codEnabled, freeShipping });
    } catch (err) {
      next(err);
    }
  },

  async getAll(req, res, next) {
    try {
      const docs = await Settings.find().lean();
      const map = {};
      docs.forEach(d => { map[d.key] = d.value; });
      Object.keys(DEFAULTS).forEach(k => {
        if (map[k] === undefined) map[k] = DEFAULTS[k];
      });
      return successResponse(res, map);
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const { key, value } = req.body;
      if (!key) return errorResponse(res, 'key is required', 400);
      await Settings.set(key, value);
      return successResponse(res, { key, value }, 'Setting updated');
    } catch (err) {
      next(err);
    }
  },

  async toggleCod(req, res, next) {
    try {
      const current = await Settings.get('codEnabled', false);
      const newVal = !current;
      await Settings.set('codEnabled', newVal);
      return successResponse(res, { codEnabled: newVal }, `COD ${newVal ? 'enabled' : 'disabled'}`);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = settingsController;
