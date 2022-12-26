require('dotenv').config()

const attachUser = (req, res, next) => {
	// Get the JWT from the request header
	const token = req.headers.authorization;
  
	// If there is no JWT, return a 401 unauthorized response
	if (!token) {
	  return res.status(401).send({ error: 'Unauthorized' });
	}
  
	// If there is a JWT, verify it and attach the user to the request object
	jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
	  if (error) {
		return res.status(401).send({ error: 'Unauthorized' });
	  }
  
	  // Find the user in the database using the JWT
	  User.findByPk(decoded.id)
		.then(user => {
		  // Attach the user to the request object
		  req.user = user;
		  next();
		})
		.catch(error => {
		  res.status(500).send({ error: error });
		});
	});
  };
  
  module.exports = attachUser;