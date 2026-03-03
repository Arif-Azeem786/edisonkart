const Contact = require('./contact.model');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');

const contactController = {
  // Submit a contact form (Public)
  async create(req, res, next) {
    try {
      const { name, email, subject, message } = req.body;

      if (!name || !email || !subject || !message) {
        return errorResponse(res, 'All fields are required', 400);
      }

      const contact = await Contact.create({ name, email, subject, message });

      successResponse(res, contact, 'Message sent successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  // Get all contact submissions (Admin only)
  async getAll(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        search
      } = req.query;

      const query = {};
      if (status && status !== 'all') query.status = status;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { subject: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;

      const [contacts, total] = await Promise.all([
        Contact.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        Contact.countDocuments(query)
      ]);

      const statusCounts = await Contact.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      const counts = { NEW: 0, READ: 0, RESOLVED: 0, total: 0 };
      statusCounts.forEach(s => {
        counts[s._id] = s.count;
        counts.total += s.count;
      });

      successResponse(res, {
        contacts,
        counts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Update contact status (Admin only)
  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['NEW', 'READ', 'RESOLVED'].includes(status)) {
        return errorResponse(res, 'Invalid status', 400);
      }

      const contact = await Contact.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );

      if (!contact) {
        return errorResponse(res, 'Contact submission not found', 404);
      }

      successResponse(res, contact, 'Status updated successfully');
    } catch (error) {
      next(error);
    }
  },

  // Delete a contact submission (Admin only)
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      const contact = await Contact.findByIdAndDelete(id);
      if (!contact) {
        return errorResponse(res, 'Contact submission not found', 404);
      }

      successResponse(res, null, 'Contact submission deleted successfully');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = contactController;
