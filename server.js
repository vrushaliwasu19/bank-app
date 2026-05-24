const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// ADD THIS LINE
app.set("trust proxy", 1);

// REPLACE SESSION BLOCK WITH THIS
app.use(session({
  secret: 'bank-secret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'none'
  }
}));

app.use(session({
  secret: 'bank-secret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true
  }
}));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

let users = {
  admin: {
    password: 'admin123',
    balance: 10000,
    email: 'admin@bank.com'
  }
};

function isAuthenticated(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/');
  }
}
app.get('/', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (
    users[username] &&
    users[username].password === password
  ) {
    req.session.user = username;
    res.redirect('/dashboard');
  } else {
    res.send('Invalid credentials');
  }
});
app.get('/dashboard', isAuthenticated, (req, res) => {
  const user = users[req.session.user];

  res.render('dashboard', {
    username: req.session.user,
    balance: user.balance
  });
});

app.get('/transfer', isAuthenticated, (req, res) => {
  res.render('transfer');
});
// VULNERABLE ENDPOINT
app.post('/transfer', isAuthenticated, (req, res) => {
  const { to, amount } = req.body;

  users[req.session.user].balance -= Number(amount);

  console.log('Money transferred');
  console.log('To:', to);
  console.log('Amount:', amount);

  res.send(`
    <h1>Transfer Successful</h1>
    <p>Sent $${amount} to ${to}</p>
    <a href="/dashboard">Back</a>
  `);
});
app.get('/profile', isAuthenticated, (req, res) => {
  const user = users[req.session.user];

  res.render('profile', {
    email: user.email
  });
});

app.post('/profile/update', isAuthenticated, (req, res) => {
  users[req.session.user].email = req.body.email;

  res.send(`
    <h1>Email Updated</h1>
    <p>New Email: ${req.body.email}</p>
    <a href="/dashboard">Back</a>
  `);
});
app.listen(3000, () => {
  console.log('Bank app running on http://localhost:3000');
});
