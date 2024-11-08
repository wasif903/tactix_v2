import Jwt from "jsonwebtoken";

const Authenticate = (allowedRoles, allowedStatus) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;

      if (!token) {
        return res.status(401).json("UnAuthorized");
      }

      const decodedToken = Jwt.verify(
        token.split(" ")[1],
        process.env.JWT_SECRET_KEY
      );
      const verifyRoles = decodedToken.role;
      const verifyStatus = decodedToken.status;

      const checkRoles = allowedRoles
        ? allowedRoles.some((role) => verifyRoles.includes(role))
        : true;
      const checkStatus = allowedStatus
        ? allowedStatus.includes(verifyStatus)
        : true;

      if (!checkRoles) {
        return res.status(403).json("Forbidden");
      }

      if (!checkStatus) {
        return res.status(403).json("This User Is Blocked");
      }

      req.userId = decodedToken.id;
      req.userRole = decodedToken.role;
      req.userStatus = decodedToken.status;

      return next();
    } catch (error) {
      console.log(error, "middleware error");
      return res.status(500).json(error);
    }
  };
};

export default Authenticate;
