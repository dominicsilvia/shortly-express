const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  //if req has no cookies, generate a session with uniqe hash -> store in sessions db (with userID)
  //use unique hash to set a cookie in the response headers

  Promise.resolve(req.cookies.shortlyid)
    .then(hash => {
      //
      if (!hash) {
        //hash doesnt exist, create session
        throw hash;
      } else {
        //get session form db
        return models.Sessions.get({ hash });
      }
    })
    .then(session => {
      if (!session) {
        res.clearCookie('shortlyid');
        throw session;
      }
      return session;
    })
    .catch(() => {
      ///make a session
      return models.Sessions.create()
        .then(data => {
          return models.Sessions.get({ id: data.insertId });
        })
        .then(session => {
          res.cookie('shortlyid', session.hash);
          return session;
        });
    })
    .then(session => {
      req.session = session;
      next();
    });



  // if (!req.cookies.shortlyid) {
  //   //cookie doesn't exist - create a session
  //   models.Sessions.create()
  //     .then(data => models.Sessions.get({ id: data.insertId }))
  //     .then(session => {
  //       res.cookie('shortlyid', session.hash);
  //       return session;
  //     })
  //     .then(session => {
  //       req.session = session;
  //       next();
  //     });
  //   // .then(data => console.log('data from auth', data));
  // } else {
  //   //cookie exists - look up session
  //   models.Sessions.get({ hash: req.cookies['shortlyid'] })
  //     .then(session => {
  //       if (session) {
  //         //session is in db
  //         req.session = session;
  //       } else {
  //         res.clearCookie('shortlyid');
  //         //session not in db
  //       }
  //       console.log('results of session get ---->', session, req.session);
  //       next();
  //     });
  // }



  //if request has a cookie, verify the cookie is valid (ie it is a sesion stored in the database)

  //if incoming session is not valid, what do we do with session and cookie?


  // console.log('request headers from auth middleware -------->', req.headers);

  //next();
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

module.exports.verifySession = (req, res, next) => {
  //check to see if session is associated with a user
  /// if so, return next();
  return models.Sessions.isLoggedIn(req.session) ? next() : res.redirect('/login');
};