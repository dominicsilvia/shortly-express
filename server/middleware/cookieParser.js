const parseCookies = (req, res, next) => {
  //access cookie in incoming request

  req.cookies = {};

  if (req.headers.cookie) {
    const reqCookies = req.headers.cookie.split('; ');

    //parse cookies into an object
    const parsedCookies = {};
    reqCookies.forEach(reqCookie => {
      const parsedCookie = reqCookie.split('=');
      parsedCookies[parsedCookie[0]] = parsedCookie[1];
    });

    console.log('Parsed Cookies ---->', parsedCookies);
    //assign object to a cookies property on the request
    req.cookies = parsedCookies;

  }

  next();
};

module.exports = parseCookies;