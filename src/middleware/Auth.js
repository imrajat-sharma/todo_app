const User = require("../model/user.model");
const AppError = require("../utils/app-error");
const asyncHandler = require("../utils/async-handler");
const { clearAuthCookies, setAuthCookies } = require("../utils/cookies");
const {
  generateAuthTokens,
  hashToken,
  verifyAccessToken,
  verifyRefreshToken,
} = require("../utils/tokens");

const getAccessToken = (req) => {
  const authorization = req.headers.authorization || "";

  if (authorization.startsWith("Bearer ")) {
    return authorization.slice(7);
  }

  return req.cookies?.accessToken;
};

const getRefreshToken = (req) => req.cookies?.refreshToken || req.headers["x-refresh-token"];

const getActiveRefreshTokens = (tokens = []) =>
  tokens.filter((token) => token.expiresAt && token.expiresAt > new Date());

const buildSafeUser = (user) => (typeof user.toSafeObject === "function" ? user.toSafeObject() : user);

const resolveAuthenticatedUser = async (req, res, { allowRefresh = true } = {}) => {
  if (req.user) {
    return req.user;
  }

  const accessToken = getAccessToken(req);

  if (accessToken) {
    try {
      const payload = verifyAccessToken(accessToken);
      const user = await User.findById(payload.sub);

      if (user) {
        const safeUser = buildSafeUser(user);
        req.user = safeUser;
        res.locals.currentUser = safeUser;
        return safeUser;
      }
    } catch (error) {
      if (!["TokenExpiredError", "JsonWebTokenError", "NotBeforeError"].includes(error.name)) {
        throw error;
      }
    }
  }

  if (!allowRefresh) {
    return null;
  }

  const refreshToken = getRefreshToken(req);

  if (!refreshToken) {
    return null;
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.sub).select("+refreshTokens");

    if (!user) {
      clearAuthCookies(res);
      return null;
    }

    const tokenHash = hashToken(refreshToken);
    const activeRefreshTokens = getActiveRefreshTokens(user.refreshTokens);
    const matchedToken = activeRefreshTokens.find((token) => token.tokenHash === tokenHash);

    if (!matchedToken) {
      user.refreshTokens = activeRefreshTokens;
      await user.save();
      clearAuthCookies(res);
      return null;
    }

    const nextTokens = generateAuthTokens(user);

    user.refreshTokens = activeRefreshTokens
      .filter((token) => token.tokenHash !== tokenHash)
      .concat({
        tokenHash: hashToken(nextTokens.refreshToken),
        expiresAt: nextTokens.refreshTokenExpiresAt,
      });

    await user.save();
    setAuthCookies(res, nextTokens);

    const safeUser = buildSafeUser(user);
    req.user = safeUser;
    res.locals.currentUser = safeUser;
    return safeUser;
  } catch (error) {
    clearAuthCookies(res);
    return null;
  }
};

const attachCurrentUser = asyncHandler(async (req, res, next) => {
  await resolveAuthenticatedUser(req, res, { allowRefresh: true });
  next();
});

const authenticate = asyncHandler(async (req, res, next) => {
  const user = await resolveAuthenticatedUser(req, res, { allowRefresh: true });

  if (!user) {
    clearAuthCookies(res);

    if (req.accepts(["html", "json"]) === "html") {
      return res.redirect("/auth/login");
    }

    throw new AppError("Authentication required", 401);
  }

  next();
});

const redirectIfAuthenticated = asyncHandler(async (req, res, next) => {
  const user = await resolveAuthenticatedUser(req, res, { allowRefresh: true });

  if (user) {
    return res.redirect("/dashboard");
  }

  next();
});

module.exports = {
  attachCurrentUser,
  authenticate,
  redirectIfAuthenticated,
  resolveAuthenticatedUser,
};
