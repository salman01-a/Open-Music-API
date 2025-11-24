import Joi from "joi";

const validators = (schema) => (payload) =>
    schema.validate(payload, { abortEarly: false });

const playlistSchema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
});

export const validatePlaylist = validators(playlistSchema);