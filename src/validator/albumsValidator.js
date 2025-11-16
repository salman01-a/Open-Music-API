import Joi from "joi";

const validators = (schema) => (payload) =>
  schema.validate(payload, { abortEarly: false });

const albumSchema = Joi.object({
    name: Joi.string().required(),
    year: Joi.number().integer().required(),
});

export const validateAlbum = validators(albumSchema);