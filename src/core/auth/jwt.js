import jwt from "jsonwebtoken";
const generateToken = (payload ,expiresIn = "24h") => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

export {
  generateToken,
  verifyToken,
};
