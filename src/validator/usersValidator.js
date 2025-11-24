import Joi from "joi";

const validators = (schema) => (payload) =>
  schema.validate(payload, { abortEarly: false });

const userSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().min(6).required(),
    fullname: Joi.string().min(3).max(100).required(),
});

const validateUser = validators(userSchema);

export {validateUser};