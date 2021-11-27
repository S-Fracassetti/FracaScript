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
const sha256 = require('sha256');
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
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('./publics'));

app.set('trust proxy', 1) // trust first proxy
app.use(expressSession({
  secret: 'IUsd9ds!!$d',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

/* Blocks */
const blocks = fs.readdirSync('./views/blocks/')
                 .filter(file => !file.startsWith('.'))
                 .map(file => file.split('.').reverse().slice(1).reverse().join('.'));

/* Login system */
if(!fs.existsSync(settings.sessions_database)) fs.writeFileSync(settings.sessions_database, '{}');
if(!fs.existsSync(settings.accounts_database)) fs.writeFileSync(settings.accounts_database, '[]');
const login = (username, password = null, object = {}) => {
    const censor = object?.censor || [];
    const createSession = object?.createSession;

    const accounts = JSON.parse(fs.readFileSync(settings.accounts_database).toString());
    const sessions = JSON.parse(fs.readFileSync(settings.sessions_database).toString());
    if(password === null){
        const session = sessions[username];
        if(!session || session.expiration < Math.floor(Date.now() / 1000)) return false;
        return accounts.find(account => account.id === session.account);
    }
    else{
        const account = accounts.find(account => account.email === username && account.password === sha256(password));
        if(!account) return false;
        censor.forEach(key => delete account[key]);
        const session_id = uuid();
        if(createSession){
            sessions[session_id] || (sessions[session_id] = {});
            sessions[session_id].expiration = Math.floor(Date.now() / 1000) + settings.session_duration;
            sessions[session_id].account = account.id;
            fs.writeFileSync(settings.sessions_database, JSON.stringify(sessions));
        }
        return Object.assign(account, { session_id });
    }
}

/* Routes */
app.get('/', (req, res) => {
    const session = req.session.login
    if(!login(session)) return res.redirect('/login');
    return res.render('dashboard');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    try{
        const session = login(username, password, { createSession: true });
        if(!session) return res.render('login', { error: 'Credenziali non valide!' });
        req.session.login = session.session_id;
        res.redirect('/');
    } catch(e){ res.render('login', { error: 'Errore del server, riprova più tardi' }) }
});

app.get('/login', (req, res) => {
    const session = req.session.login;
    if(login(session)) return res.redirect('/');
    res.render('login');
});

app.post('/api/section/:blockName', (req, res) => {
  const blockName = req.params.blockName.toLowerCase();
  if(!blocks.includes(blockName))
    return res.status(404).json({ success: false, status: 404, description: "Sezione non trovata" });
  
  const content = fs.readFileSync(`./views/blocks/${blockName}.html`).toString();
  return res.json({ success: true, content, status: 200 });
});

/* Ports reservation */
server.listen(settings.WebServerPort || 80, () => console.log('WebServer in ascolto sulla porta'.brightBlue.bold, (settings.WebServerPort || 80).toString().white));