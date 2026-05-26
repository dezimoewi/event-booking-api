const eventService = require('../services/event.service');

const getAllEvents = async (req, res, next) => {
  try {
    const result = await eventService.getAllEvents(req.query);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const getEventById = async (req, res, next) => {
  try {
    const event = await eventService.getEventById(req.params.id);
    res.status(200).json({ data: event });
  } catch (err) {
    next(err);
  }
};

const createEvent = async (req, res, next) => {
  try {
    const event = await eventService.createEvent(req.body, req.user.id);
    res.status(201).json({
      message: 'Event created successfully.',
      data: event,
    });
  } catch (err) {
    next(err);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    const event = await eventService.updateEvent(req.params.id, req.body, req.user.id);
    res.status(200).json({
      message: 'Event updated successfully.',
      data: event,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllEvents, getEventById, createEvent, updateEvent };
