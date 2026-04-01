const User = require("../model/user.model");
const AppError = require("../utils/app-error");
const asyncHandler = require("../utils/async-handler");
const { clearAuthCookies, setAuthCookies } = require("../utils/cookies");
const {
  generateAuthTokens,
  hashToken,
  verifyRefreshToken,
} = require("../utils/tokens");

const getTrimmedValue = (value) =>
  typeof value === "string" ? value.trim() : "";

const renderAuthView = (res, view, payload = {}) =>
  res.status(payload.statusCode || 200).render(`auth/${view}`, {
    title: payload.title,
    currentPath: payload.currentPath,
    currentUser: null,
    error: payload.error || "",
    message: payload.message || "",
    values: payload.values || {},
  });

const registerPage = (req, res) =>
  renderAuthView(res, "register", {
    title: "Create account",
    currentPath: "/auth/register",
    message: req.query.message,
  });

const loginPage = (req, res) =>
  renderAuthView(res, "login", {
    title: "Sign in",
    currentPath: "/auth/login",
    message: req.query.message,
  });

const resetPage = (req, res) =>
  res.render("auth/reset", {
    title: "Password update",
    currentPath: "/auth/reset",
    currentUser: null,
  });

const createSession = async (user, res) => {
  const tokens = generateAuthTokens(user);

  user.refreshTokens = Array.isArray(user.refreshTokens)
    ? user.refreshTokens
    : [];
  user.refreshTokens = user.refreshTokens
    .filter((token) => token.expiresAt > new Date())
    .slice(-4)
    .concat({
      tokenHash: hashToken(tokens.refreshToken),
      expiresAt: tokens.refreshTokenExpiresAt,
    });

  await user.save();
  setAuthCookies(res, tokens);
};

const register = asyncHandler(async (req, res) => {
  const name = getTrimmedValue(req.body.name);
  const username = getTrimmedValue(req.body.username).toLowerCase();
  const email = getTrimmedValue(req.body.email).toLowerCase();
  const password = req.body.password || "";
  const confirmPassword = req.body.confirmPassword || "";

  if (!name || !username || !email || !password || !confirmPassword) {
    return renderAuthView(res, "register", {
      title: "Create account",
      currentPath: "/auth/register",
      statusCode: 400,
      error: "All fields are required.",
      values: { name, username, email },
    });
  }

  if (password !== confirmPassword) {
    return renderAuthView(res, "register", {
      title: "Create account",
      currentPath: "/auth/register",
      statusCode: 400,
      error: "Passwords do not match.",
      values: { name, username, email },
    });
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    return renderAuthView(res, "register", {
      title: "Create account",
      currentPath: "/auth/register",
      statusCode: 409,
      error:
        existingUser.email === email
          ? "Email already exists."
          : "Username already exists.",
      values: { name, username, email },
    });
  }

  const user = await User.create({
    name,
    username,
    email,
    password,
    profileImage: req.file?.filename || null,
  });

  const hydratedUser = await User.findById(user._id).select("+refreshTokens");
  await createSession(hydratedUser, res);

  return res.redirect("/dashboard?message=Account created successfully");
});

const login = asyncHandler(async (req, res) => {
  const email = getTrimmedValue(req.body.email).toLowerCase();
  const password = req.body.password || "";

  if (!email || !password) {
    return renderAuthView(res, "login", {
      title: "Sign in",
      currentPath: "/auth/login",
      statusCode: 400,
      error: "Email and password are required.",
      values: { email },
    });
  }

  const user = await User.findOne({ email }).select("+password +refreshTokens");

  if (!user) {
    return renderAuthView(res, "login", {
      title: "Sign in",
      currentPath: "/auth/login",
      statusCode: 401,
      error: "Invalid email or password.",
      values: { email },
    });
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    return renderAuthView(res, "login", {
      title: "Sign in",
      currentPath: "/auth/login",
      statusCode: 401,
      error: "Invalid email or password.",
      values: { email },
    });
  }

  await createSession(user, res);

  return res.redirect("/dashboard?message=Welcome back");
});

const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      const user = await User.findById(payload.sub).select("+refreshTokens");

      if (user) {
        user.refreshTokens = (user.refreshTokens || []).filter(
          (token) => token.tokenHash !== hashToken(refreshToken),
        );
        await user.save();
      }
    } catch (error) {}
  }

  clearAuthCookies(res);
  res.redirect("/auth/login?message=You have been signed out");
});

const refreshSession = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    throw new AppError("Refresh token is required", 401);
  }

  const payload = verifyRefreshToken(refreshToken);
  const user = await User.findById(payload.sub).select("+refreshTokens");

  if (!user) {
    throw new AppError("Session not found", 401);
  }

  const activeTokens = (user.refreshTokens || []).filter(
    (token) => token.expiresAt > new Date(),
  );
  const matchedToken = activeTokens.find(
    (token) => token.tokenHash === hashToken(refreshToken),
  );

  if (!matchedToken) {
    clearAuthCookies(res);
    throw new AppError("Invalid refresh token", 401);
  }

  const nextTokens = generateAuthTokens(user);

  user.refreshTokens = activeTokens
    .filter((token) => token.tokenHash !== hashToken(refreshToken))
    .concat({
      tokenHash: hashToken(nextTokens.refreshToken),
      expiresAt: nextTokens.refreshTokenExpiresAt,
    });

  await user.save();
  setAuthCookies(res, nextTokens);

  if (req.accepts(["html", "json"]) === "html") {
    return res.redirect("/dashboard?message=Session refreshed");
  }

  return res.status(200).json({
    success: true,
    message: "Session refreshed",
  });
});

const updatePassword = asyncHandler(async (req, res) => {
  const currentPassword = req.body.currentPassword || "";
  const newPassword = req.body.newPassword || "";
  const confirmNewPassword = req.body.confirmNewPassword || "";

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return res.redirect("/dashboard?error=All password fields are required");
  }

  if (newPassword !== confirmNewPassword) {
    return res.redirect("/dashboard?error=New passwords do not match");
  }

  const user = await User.findById(req.user.id).select(
    "+password +refreshTokens",
  );

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const isPasswordValid = await user.comparePassword(currentPassword);

  if (!isPasswordValid) {
    return res.redirect("/dashboard?error=Current password is incorrect");
  }

  user.password = newPassword;
  user.refreshTokens = [];
  await user.save();

  await createSession(user, res);

  return res.redirect("/dashboard?message=Password updated successfully");
});

module.exports = {
  login,
  loginPage,
  logout,
  refreshSession,
  register,
  registerPage,
  resetPage,
  updatePassword,
};
