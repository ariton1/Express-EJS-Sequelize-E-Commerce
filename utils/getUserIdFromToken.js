const jwt = require("jsonwebtoken");

function getUserIdFromToken(req) {
  const token = req.cookies.token;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id;
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
}

module.exports = getUserIdFromToken;
