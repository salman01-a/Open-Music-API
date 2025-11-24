import Joi from "joi";
const validators = (schema) => (payload) =>
  schema.validate(payload, { abortEarly: false });

const authSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
});

const authTokenSchema = Joi.object({
    refreshToken: Joi.string().required(),
});
const validateAuth = validators(authSchema);
const validateAuthToken = validators(authTokenSchema);
export {validateAuth, validateAuthToken};

