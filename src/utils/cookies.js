const parseDurationToMs = (value, fallback) => {
  if (!value) {
    return fallback;
  }

  const match = /^(\d+)(ms|s|m|h|d)$/.exec(String(value).trim());

  if (!match) {
    return fallback;
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const unitMap = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * unitMap[unit];
};

const getBaseCookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
});

const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie("accessToken", accessToken, {
    ...getBaseCookieOptions(),
    maxAge: parseDurationToMs(process.env.ACCESS_TOKEN_EXPIRES_IN, 15 * 60 * 1000),
  });

  res.cookie("refreshToken", refreshToken, {
    ...getBaseCookieOptions(),
    maxAge: parseDurationToMs(process.env.REFRESH_TOKEN_EXPIRES_IN, 7 * 24 * 60 * 60 * 1000),
  });
};

const clearAuthCookies = (res) => {
  res.clearCookie("accessToken", getBaseCookieOptions());
  res.clearCookie("refreshToken", getBaseCookieOptions());
};

module.exports = {
  clearAuthCookies,
  parseDurationToMs,
  setAuthCookies,
};
