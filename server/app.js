const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const bodyParser = require('body-parser');
const Auth = require('./middleware/auth');
const models = require('./models');
const cookieParser = require('./middleware/cookieParser');

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser);
app.use(Auth.createSession);
app.use(express.static(path.join(__dirname, '../public')));




app.get('/', Auth.verifySession,
  (req, res) => {
    res.render('index');
  });

app.get('/create', Auth.verifySession,
  (req, res) => {
    res.render('index');
  });

app.get('/links', Auth.verifySession,
  (req, res, next) => {
    models.Links.getAll()
      .then(links => {
        res.status(200).send(links);
      })
      .error(error => {
        res.status(500).send(error);
      });
  });

app.post('/links',
  (req, res, next) => {
    var url = req.body.url;
    if (!models.Links.isValidUrl(url)) {
      // send back a 404 if link is not valid
      return res.sendStatus(404);
    }

    return models.Links.get({ url })
      .then(link => {
        if (link) {
          throw link;
        }
        return models.Links.getUrlTitle(url);
      })
      .then(title => {
        return models.Links.create({
          url: url,
          title: title,
          baseUrl: req.headers.origin
        });
      })
      .then(results => {
        return models.Links.get({ id: results.insertId });
      })
      .then(link => {
        throw link;
      })
      .error(error => {
        res.status(500).send(error);
      })
      .catch(link => {
        res.status(200).send(link);
      });
  });

/************************************************************/
// Write your authentication routes here
/************************************************************/
app.get('/login', (req, res, next) => {
  //render login page
  res.render('login');

});

app.get('/signup', (req, res, next) => {
  //render signup page
  res.render('signup');
});


app.post('/login', (req, res, next) => {
  //get password and salt for entered username
  //compare entered password with one supplied by user
  return models.Users.get({ username: req.body.username })
    .then(results => {
      if (results) {
        req.session.userId = results.id;
        return models.Users.compare(req.body.password, results.password, results.salt);
      } else {
        return false;
      }
    })
    .then(isValid => {
      if (isValid) {
        //redirect to index
        res.redirect('/');
        return models.Sessions.update({ id: req.session.id }, { userId: req.session.userId });
        //update the session record with userID of the user who logged in
        //userID

      } else {
        //redirect to login
        res.redirect(401, '/login');
      }
    }).catch(error => res.status(400).send(error));


});

app.post('/signup', (req, res, next) => {

  models.Users.get({ username: req.body.username })
    .then(results => {
      if (!results) {
        //user is not in database - sign up
        models.Users.create({ username: req.body.username, password: req.body.password })
          .then(result => {
            res.redirect('/');
            return models.Sessions.update({ id: req.session.id }, { userId: result.insertId });
          })
          .catch(error => res.status(500).send(error));
      } else {
        //user is already in database, redirect to login page
        res.redirect('/signup');
      }
    });
});


app.get('/logout', (req, res, next) => {
  //delete cookie
  res.clearCookie('shortlyid');
  //delete session from sessions table
  return models.Sessions.delete({ id: req.session.id })
    .then(() => next())
    .catch(error => console.log('error logging out', error));
});




/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {

  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;
