function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  const isHtmlRequest = req.accepts(["html", "json"]) === "html";

  if (isHtmlRequest) {
    return res.status(statusCode).render(statusCode === 404 ? "404" : "error", {
      title: statusCode === 404 ? "Not Found" : "Something went wrong",
      currentPath: req.originalUrl,
      currentUser: res.locals.currentUser || null,
      message,
      statusCode,
    });
  }

  return res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
}

module.exports = errorHandler;
