const express = require('express');
const favicon = require('express-favicon');
//const db = require('./src/db.js');
const path = require('path');
const mysql = require('mysql');
var bodyParser = require('body-parser');
const app = express();
app.use(favicon(__dirname + '/build/favicon.ico'));
// the __dirname is the current directory from where the script is running
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'build')));
app.use(bodyParser.raw())

var connection = "";

async function query(query, host, database, user, password, res){
	try {
		if (connection === "")
			connection = mysql.createConnection({
				host: host,
				database: database,
				user: user,
				password: password
			});

		await connection.query(query, function (err, result){
			if (err){
				console.log(err);
				return err;
			};
			res.send(result);
		});
	} catch (error){
		console.log(error);
		return [error];
	};
};

app.post('/addToDB', async function (req, res){
	//console.log("password: " + process.env.REACT_APP_SQL_PASSWORD);
	query(req["headers"]["sql_string"], req["headers"]["sqlhost"], req["headers"]["sqldatabase"], req["headers"]["sqluser"], process.env.REACT_APP_SQL_PASSWORD, res);
});

app.get('/*', function (req, res) {
	res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const server = app.listen(0, () => {
    console.log('Example app listening at http://localhost:', server.address().port);
});
