import Joi from "joi";

const validators = (schema) => (payload) =>
    schema.validate(payload, { abortEarly: false });

const playlistSchema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
});

const playlistSongSchema = Joi.object({
    songId: Joi.string().required(),
});
const validatePlaylist = validators(playlistSchema)
const validatePlaylistSong = validators(playlistSongSchema)
export {validatePlaylist, validatePlaylistSong};