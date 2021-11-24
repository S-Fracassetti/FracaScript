/*
 *  FracaScript Interface Server
 *  Credits to:
 *		Simone Fracassetti
 *		Yael Benvenisti
 *		Gabriel Pinetti
 *		Manuel Muttoni
 *		Michele Pagani
 */

/* Packages */
const express = require('express');
const expressSession = require('express-session');
const http = require('http');
const fs = require('fs');
const uuid = require('uuid').v4;
const bodyParser = require('body-parser');
require('colors');

/* Import settings */
const settings = {};
if(!fs.existsSync('./setup.fscs')) fs.writeFileSync('./setup.fscs', '');
fs.readFileSync('./setup.fscs').toString()
	.split('\n')
	.filter(i => i.replaceAll(' ', '').replaceAll('\t', ''))
	.map(line => {
		const key = line.split('=')[0].replaceAll(' ', '').replaceAll('\t', '');
		const value = line.split('=').slice(1).join('=');
		settings[key] = !Number.isNaN(Number(value)) ? Number(value) : value;
	});

console.clear();
console.log('Impostazioni importate'.brightBlue.bold, Object.keys(settings).length.toString().white);

/* Server */
const app = express();
const server = http.createServer(app);

app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.use(express.static('./publics'));

app.set('trust proxy', 1) // trust first proxy
app.use(expressSession({
  secret: 'IUsd9ds!!$d',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

/* Routes */
app.get('/', (req, res) => res.render('dashboard'));

/* Ports reservation */
server.listen(settings.WebServerPort || 80, () => console.log('WebServer in ascolto sulla porta'.brightBlue.bold, (settings.WebServerPort || 80).toString().white));