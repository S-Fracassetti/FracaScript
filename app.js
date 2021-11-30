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
if(!fs.existsSync(settings.sessions_database)) fs.writeFileSync(settings.sessions_database, '[]');
if(!fs.existsSync(settings.accounts_database)) fs.writeFileSync(settings.accounts_database, '{}');

/* Apps and system */
if(!fs.existsSync(settings.apps_database)) fs.writeFileSync(settings.apps_database, '{}');

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
    return res.render('dashboard', { session });
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

app.use('/private', (req, res, next) => {
    const params = req[req.method === 'GET' ? 'query' : 'body'];
    if(!params.session) return res.status(403).json({ success: false, error: 'Non autorizzato.' });
    const access = login(params.session);
    if(!access) return res.status(403).json({ success: false, error: 'Non autorizzato.' });
    req.account = access;
    next();
});

app.get('/private/my-apps', (req, res) => {
    const apps = (JSON.parse(fs.readFileSync(settings.apps_database).toString())[req.account.id]) || [];
    res.json({ success: true, apps: apps.reverse() });
});

app.patch('/private/change-app-title', (req, res) => {
    const { appId } = req.body;
    const newTitle = req.body.newTitle.rawContent();
    if(typeof newTitle !== 'string') return res.status(400).json({ success: false, error: 'Stringa non valida' });
    const apps = JSON.parse(fs.readFileSync(settings.apps_database).toString());
    const target = apps[req.account.id].find(i => i.appId === appId);
    if(!target) return res.status(404).json({ success: false, error: 'Applicazione non trovata' });
    if(newTitle.length > 32 || newTitle.length < 4) return res.status(400).json({ success: false, error: "Il nome dell'app deve avere una lunghezza compresa tra 4 e 32 caratteri." });
    if([...newTitle].find(char => ![...'abcdefghijklmnopqrstuvyxz0123456789 -_#'].includes(char.toLowerCase()))) return res.status(400).json({ success: false, error: "Il nome dell'app deve essere formato solo da lettere, numeri o caratteri come: _-#" });
    target.name = newTitle;
    fs.writeFileSync(settings.apps_database, JSON.stringify(apps));
    res.json({ success: true });
});

app.patch('/private/change-app-description', (req, res) => {
    const { appId } = req.body;
    const newDescription = req.body.newDescription.rawContent();
    if(typeof newDescription !== 'string') return res.status(400).json({ success: false, error: 'Stringa non valida' });
    const apps = JSON.parse(fs.readFileSync(settings.apps_database).toString());
    const target = apps[req.account.id].find(i => i.appId === appId);
    if(!target) return res.status(404).json({ success: false, error: 'Applicazione non trovata' });
    if(newDescription.length > 1024 || !newDescription) return res.status(400).json({ success: false, error: "La descrizione dell'app deve avere una lunghezza massima di 1024 caratteri." });
    target.description = newDescription;
    fs.writeFileSync(settings.apps_database, JSON.stringify(apps));
    res.json({ success: true });
});

const editorSessions = {};
app.post('/private/editor/createSession', (req, res) => {
    const { appId } = req.body;
    const apps = JSON.parse(fs.readFileSync(settings.apps_database).toString());
    const target = apps[req.account.id]?.find(i => i.appId === appId);
    if(!target) return res.status(404).json({ success: false, error: 'Applicazione non trovata' });

    const id = uuid();
    editorSessions[id] = {
        target,
        account: req.account,
        id,
        creation: Math.floor(Date.now() / 1000)
    }

    res.json({ success: true, id });
});

app.post('/private/create-app', (req, res) => {
    const { type, description } = req.body;
    const name = req.body.name.rawContent();
    if(!['mobile', 'desktop'].includes(type)) return res.status(400).json({ success: false, error: 'Tipo di app non valido (mobile o desktop).' });
    if(name.length > 32 || name.length < 4) return res.status(400).json({ success: false, error: "Il nome dell'app deve avere una lunghezza compresa tra 4 e 32 caratteri." });
    if([...name].find(char => ![...'abcdefghijklmnopqrstuvyxz0123456789 -_#'].includes(char.toLowerCase()))) return res.status(400).json({ success: false, error: "Il nome dell'app deve essere formato solo da lettere, numeri o caratteri come: _-#" });
    if(description.length > 1024) return res.status(400).json({ success: false, error: "La descrizione deve avere una lunghezza massima di 1024 caratteri" });

    const apps = JSON.parse(fs.readFileSync(settings.apps_database).toString());
    if(!apps[req.account.id]) apps[req.account.id] = [];
    if(apps[req.account.id].find(i => i.name === name)) return res.status(409).json({ success: false, error: "Esiste già un'applicazione sul tuo account con questo nome" });

    const appId = uuid();
    const app = { appId, type, name, description, sketch: `/* Applicazione ${name}! */`, creationDate: Math.floor(Date.now() / 1000) };
    apps[req.account.id].push(app);
    fs.writeFileSync(settings.apps_database, JSON.stringify(apps));
    res.json({ success: true, app });
});

app.delete('/private/delete-app', (req, res) => {
    const { appId } = req.body;
    const apps = JSON.parse(fs.readFileSync(settings.apps_database).toString());
    if(apps[req.account.id]){
        apps[req.account.id] = apps[req.account.id].filter(i => i.appId !== appId);
        fs.writeFileSync(settings.apps_database, JSON.stringify(apps));
    }
    res.json({ ok: true });
});

/* Ports reservation */
server.listen(settings.WebServerPort || 80, () => console.log('WebServer in ascolto sulla porta'.brightBlue.bold, (settings.WebServerPort || 80).toString().white));

String.prototype.rawContent = function(){
    const string = this;
    let startIndex = false;
    let stopIndex = false;
    return [...string].filter(i => {
        if((i === '\t' || i === ' ') && !startIndex) return false;
        else return startIndex = true;
    }).reverse().filter(i => {
        if((i === '\t' || i === ' ') && !stopIndex) return false;
        else return stopIndex = true;
    }).reverse().join('');
}