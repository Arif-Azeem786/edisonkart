const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
}, { timestamps: true });

settingsSchema.statics.get = async function (key, defaultVal = null) {
  const doc = await this.findOne({ key });
  return doc ? doc.value : defaultVal;
};

settingsSchema.statics.set = async function (key, value) {
  return this.findOneAndUpdate({ key }, { value }, { upsert: true, new: true });
};

module.exports = mongoose.model('Settings', settingsSchema);
