import Joi from "joi";

const validators = (schema) => (payload) =>
  schema.validate(payload, { abortEarly: false });

const songSchema = Joi.object({
    title: Joi.string().required(),
    year: Joi.number().required(),
    genre: Joi.string().required(),
    performer: Joi.string().required(),
    duration: Joi.number(),
    albumId: Joi.string(),
});
export const validateSong = validators(songSchema);