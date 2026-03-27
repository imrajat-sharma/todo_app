const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { parseDurationToMs } = require("./cookies");

const getAccessTokenSecret = () => process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;
const getRefreshTokenSecret = () => process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;

const signAccessToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
      type: "access",
    },
    getAccessTokenSecret(),
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
    },
  );

const signRefreshToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      type: "refresh",
      tokenId: crypto.randomUUID(),
    },
    getRefreshTokenSecret(),
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
    },
  );

const generateAuthTokens = (user) => {
  const refreshToken = signRefreshToken(user);

  return {
    accessToken: signAccessToken(user),
    refreshToken,
    refreshTokenExpiresAt: new Date(
      Date.now() + parseDurationToMs(process.env.REFRESH_TOKEN_EXPIRES_IN, 7 * 24 * 60 * 60 * 1000),
    ),
  };
};

const verifyAccessToken = (token) => jwt.verify(token, getAccessTokenSecret());
const verifyRefreshToken = (token) => jwt.verify(token, getRefreshTokenSecret());
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

module.exports = {
  generateAuthTokens,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
