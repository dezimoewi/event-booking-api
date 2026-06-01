const bookingService = require('../services/booking.service');

const bookEvent = async (req, res, next) => {
  try {
    const seats = req.body.seats || 1;
    const result = await bookingService.bookEvent(req.params.id, req.user.id, seats);
    res.status(201).json({
      message: 'Booking confirmed.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const getUserBookings = async (req, res, next) => {
  try {
    const bookings = await bookingService.getUserBookings(req.user.id);
    res.status(200).json({ data: bookings });
  } catch (err) {
    next(err);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const result = await bookingService.cancelBooking(req.params.id, req.user.id);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { bookEvent, getUserBookings, cancelBooking };
