import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  fullName: Joi.string().min(2).required()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const appointmentCreateSchema = Joi.object({
  doctorId: Joi.number().integer().required(),
  scheduleId: Joi.number().integer().required(),
  reason: Joi.string().allow('', null)
});
