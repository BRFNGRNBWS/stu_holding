import React from 'react';
import './App.scss';
import SearchBar from './SearchBar';
import $ from 'jquery';
import ImageMapper from 'react-image-mapper';
import Perspective from './perspective.min.js';
//import db from './db';

//coordinates of the corners of each cutout, expressed as a percentage of the image width/height
//format [x, y, x, y, x, y...]
//always start coords from the top left of where the album should be and go clockwise
//this is also the order the pictures will be rendered in, so the album at the first
//coords will be rendered first, then the next one put on top of that, etc.
const coordPercentages = [
	[0.028703703703703703, 0.026851851851851852, 0.2833333333333333, 0.022222222222222223, 0.2824074074074074, 0.27870370370370373, 0.027777777777777776, 0.28055555555555556],
	[0.3592592592592593, 0.025925925925925925, 0.6138888888888889, 0.019444444444444445, 0.6175925925925926, 0.27685185185185185, 0.3611111111111111, 0.28055555555555556],
	[0.6990740740740741, 0.022222222222222223, 0.9592592592592593, 0.023148148148148147, 0.9583333333333334, 0.2796296296296296, 0.6972222222222222, 0.27870370370370373],
	[0.03518518518518519, 0.3212962962962963, 0.2833333333333333, 0.3175925925925926, 0.2861111111111111, 0.5694444444444444, 0.037037037037037035, 0.5703703703703704],
	[0.362962962962963, 0.3148148148148148, 0.6194444444444445, 0.3138888888888889, 0.6194444444444445, 0.5685185185185185, 0.36203703703703705, 0.5694444444444444],
	[0.6990740740740741, 0.3101851851851852, 0.9555555555555556, 0.31203703703703706, 0.9490740740740741, 0.5685185185185185, 0.6962962962962963, 0.5666666666666667],
	[0.22777777777777777, 0.8777777777777778, 0.49537037037037035, 0.8638888888888889, 0.5472222222222223, 0.9685185185185186, 0.2111111111111111, 0.9953703703703703]
];
//the cutout that is initially selected once the page loads
const initialSelected = 0;
//size of the preview image
//the actual size of this image doesnt really matter, it will always be scaled to the page appropriately,
//i just scaled it down to this for data/loading time saving, and because it's the biggest it ever scales to on the page
const imgSize = {x: 486, y: 486};
const previewImage = "/top7albums-template_small.png";
//size of the full image, /public/stu.png
const fullImgSize = {x: 1080, y: 1080};
const fullImage = "/top7albums-template.png";
//the resolution of album image to get from api, a value from 1-4, 1 being highest res, 4 being lowest res
const imgResolution = 2;
var scale = 1.0;
var maps = {name: "my-map", areas: []};
var placePicked = 0;
var albumsPicked = [];
var renderedImage = "";
var imageDataURLSArray = [];
var leaderShown = false;
var leaderboardLength = 10;
genMaps();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function updateMapSize(w){
	this.setState({canWidth: w});
};

//resizes the canvases and the ImgMap
function resizeStage(w){
	scale = w / imgSize.x;
	var h = imgSize.y * scale;
	updateMapSize(w);
	$(".albumStage").width(w);
	$(".albumStage").height(h);
	
	if (scale < 1){
		$(".leaderboard").css("overflow", "scroll");
		$(".leaderboard").css("white-space", "nowrap");
		$(".leaderboard td:nth-child(1)").css("display", "none");
		$(".leaderboard th:nth-child(1)").css("display", "none");
	}else {
		$(".leaderboard").css("overflow", "initial");
		$(".leaderboard").css("white-space", "initial");
		$(".leaderboard td:nth-child(1)").css("display", "block");
		$(".leaderboard th:nth-child(1)").css("display", "block");
	}
};

//calculates the pixel coordinates of the albums based on the percentage coordinate array, [x, y, x, y...] format
function calcCoords(which, imageDimensions){
	var output = [];
	for (var i = 0; i < coordPercentages[which].length; i++){
		if (i % 2 === 0)
			output.push(coordPercentages[which][i] * imageDimensions.x);
		else
			output.push(coordPercentages[which][i] * imageDimensions.y);
	};
	return output;
};

//takes coords generated from calcCoords() and puts them in [[x, y], [x, y]...] format
function parseCoords(coords){
	var output = [];
	for (var i = 0; i < 8; i += 2)
		output.push([coords[i], coords[i + 1]]);
	return output;
};

//generates the image maps using calcCoords()
function genMaps(){
	for (var i = 0; i < coordPercentages.length; i++){
		maps["areas"].push({name: i.toString(), shape: "poly", coords: calcCoords(i, imgSize), preFillColor: "rgba(0, 0, 0, 0.1)"});
	};
};

//when one of the cutout areas is clicked on
function spotClicked(area){
	var number = parseInt(area["name"]);
	placePicked = number;
	for (var i = 0; i < maps["areas"].length; i++){
		if (i === placePicked)
			maps["areas"][i]["preFillColor"] = "rgba(255, 0, 0, 0.4)";
		else
			maps["areas"][i]["preFillColor"] = "rgba(0, 0, 0, 0.1)";
	};
	this.setState({map: maps});
};

//called once an album is picked from the search bar, this puts it on the preview
function renderAlbum(album){
	albumsPicked[placePicked] = album;
	var canvas = document.getElementById("img" + placePicked);
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	var img = new Image();
	img.crossOrigin = "anonymous";
	img.onload = function(){
		var p = new Perspective(ctx, img);
		var m = maps["areas"][placePicked]["coords"];
		p.draw(parseCoords(m));	

		//selects the next area automatically
		if (placePicked === coordPercentages.length - 1)
			spotClicked(maps["areas"][0]);
		else
			spotClicked(maps["areas"][placePicked + 1]);
	};
	console.log(album["image"]);
	img.src = album["image"][album["image"].length - imgResolution]["#text"];
	
	if (albumsPicked.length === coordPercentages.length){
		$(".renderButton").css("display", "initial");
		$(".renderButton").prop("disabled", false);
	};
};

//clears all albums in the preview
function clearAlbums(){
	for (var i = 0; i < coordPercentages.length; i++){
		var canvas = document.getElementById("img" + i);
		var ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	}
	albumsPicked = [];
}

async function renderFinal(){
	$(".renderButton").html("rendering...");
	addToSQL();
	imageDataURLSArray = [];
	var canvas = document.getElementById("renderCanvas");
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	for (var i = 0; i < coordPercentages.length; i++){
		await renderImages(canvas, ctx, i);
		await sleep(50);
	};

	while (coordPercentages.length !== imageDataURLSArray.length){
		await sleep(500);
	};

	for (var i = 0; i < coordPercentages.length; i++){
		await drawRenderedImages(ctx, i);	
	};
	
	var img = new Image();
	img.onload = function(){
		ctx.drawImage(img, 0, 0);
		//console.log(canvas.toDataURL());
		$(".renderImg").attr("src", canvas.toDataURL());
		$(".pictureHolder").css("display", "none");
		$(".renderImg").css("display", "block");
		$(".renderButton").html("rendered!");
		$(".renderButton").prop("disabled", true);
	};
	img.src = fullImage;
};

function addslashes( str ) {
    return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
}

async function addToSQL(){
	//console.log("addToSQL");
	for (var i = 0; i < coordPercentages.length; i++){
		var fullAlbum = albumsPicked[i]["artist"].toLowerCase().replace(/['"/\\.,\-_]/g, "").replace(/\&/g, "and") + " - "
			+ albumsPicked[i]["name"].toLowerCase().replace(/['"/\\.,\-_]/g, "");
		var sql = "INSERT INTO mostPicked (album, name, artist, url, timesPicked) VALUES ("
			+ "'" + fullAlbum + "', '"
			+ addslashes(encodeURIComponent(albumsPicked[i]["name"])) + "', '"
			+ addslashes(encodeURIComponent(albumsPicked[i]["artist"])) + "', '"
			+ albumsPicked[i]["image"][1]["#text"] +"', 1) "
			+ "ON DUPLICATE KEY UPDATE timesPicked = timesPicked+1";
		//console.log(sql);
		
		$.ajax({
			url: "/addToDB",
			type: "post",
			headers: {
				sql_string: sql,
				sqlhost: process.env.REACT_APP_SQL_HOST,
				sqldatabase: process.env.REACT_APP_SQL_DATABASE,
				sqluser: process.env.REACT_APP_SQL_USERNAME
			},
			dataType: "json",
			success: function(data){
				//console.log("successful: ");
				//console.log(data);
			},
			error: function(data){
				//console.log("error " + data);
			}
		});
	};
};

async function renderImages(canvas, ctx, i){
	var coords = calcCoords(i, fullImgSize);
	var img = new Image();
	img.crossOrigin = "anonymous";
	img.onload = function(){
		var p = new Perspective(ctx, img);
		p.draw(parseCoords(coords));
		imageDataURLSArray[i] = canvas.toDataURL();
	};
	img.src = albumsPicked[i]["image"][albumsPicked[i]["image"].length - imgResolution]["#text"];
};

function drawRenderedImages(ctx, i){
	var img = new Image();
	img.onload = function(){
		ctx.drawImage(img, 0, 0);
	};
	img.src = imageDataURLSArray[i];
};

function startOver(){
	hideLeader();
	clearAlbums();
	$(".renderButton").css("display", "none");
	$(".pictureHolder").css("display", "block");
	$(".renderImg").css("display", "none");
	$(".renderButton").html("create album wall");
};

function toggleLeader(){
	if (leaderShown) hideLeader();
	else showLeader();
};

function showLeader(){
	$(".searchbarDiv").css("display", "none");
	$(".pictureHolder").css("display", "none");
	$(".renderImg").css("display", "none");
	$(".leaderboardButton").html("hide leaderboard");
	$(".leaderboard").css("display", "block");
	leaderShown = true;
	
	var sql = "SELECT * FROM mostPicked ORDER BY timesPicked DESC LIMIT 0, " + (leaderboardLength - 1);
	
	$.ajax({
		url: "/addToDB",
		type: "post",
		headers: {
			sql_string: sql,
			sqlhost: process.env.REACT_APP_SQL_HOST,
			sqldatabase: process.env.REACT_APP_SQL_DATABASE,
			sqluser: process.env.REACT_APP_SQL_USERNAME
		},
		dataType: "json",
		success: function(data){
			var tableBody = "<tr> <th></th> <th>Name</th> <th>Artist</th> <th>Times Picked</th> </tr>";
			for (var i = 0; i < data.length; i++){
				tableBody += 
					"<tr>" +
						"<td><img src='" + data[i]["url"] + "' /></td>" +
						"<td>" + decodeURIComponent(data[i]["name"]) + "</td>" +
						"<td>" + decodeURIComponent(data[i]["artist"]) + "</td>" +
						"<td>" + data[i]["timesPicked"] + "</td>" +
					"</tr>";
			};
			$(".leaderboard").html(tableBody);
		},
		error: function(data){
			//console.log("error " + data);
		}
	});
	

};

function hideLeader(){
	$(".searchbarDiv").css("display", "block");
	$(".pictureHolder").css("display", "block");
	$(".renderImg").css("display", "block");
	$(".leaderboardButton").html("show leaderboard");
	$(".leaderboard").css("display", "none");
	$(".leaderboard").html("");
	
	if ($(".renderButton").html() === "rendered!"){
		$(".pictureHolder").css("display", "none");
		$(".renderImg").css("display", "block");
	}else {
		$(".pictureHolder").css("display", "block");
		$(".renderImg").css("display", "none");
	};
	
	leaderShown = false;
};

$(document).ready(function(){
	$(".renderButton").css("display", "none");
	spotClicked({name: initialSelected.toString()});
	resizeStage($(".container").width());
	$(window).resize(function(){
		resizeStage($(".container").width());
	});
});



class App extends React.Component {
	constructor(props){
		super(props);
		this.state = {canWidth: imgSize.x};
	};
	
	componentDidMount(){
		updateMapSize = updateMapSize.bind(this);
		document.title = "Top 7 Albums";
	};
	
	//updated when an album is picked from the search bar
	updateAlbum = (album) => {
		renderAlbum(album);
	};
	
	renderIt = () => {
		renderFinal();
	};
	
	startOver = () => {
		startOver();
	};
	
	toggleLeader = () => {
		toggleLeader();
	};
	
	render(){
		return (
			<>
				<div className="parentContainer">
					<div className="container">
						<header className="header">
							<h1>Top 7 Albums</h1>
						</header>
						
						<div className="searchbarDiv">
							<SearchBar className="albumText" selectedAlbum={this.updateAlbum} />
						</div>
			
						<main>
							<div className="pictureHolder">
								<canvas className="albumStage" id="img0" width={imgSize.x} height={imgSize.y} />
								<canvas className="albumStage" id="img1" width={imgSize.x} height={imgSize.y} />
								<canvas className="albumStage" id="img2" width={imgSize.x} height={imgSize.y} />
								<canvas className="albumStage" id="img3" width={imgSize.x} height={imgSize.y} />
								<canvas className="albumStage" id="img4" width={imgSize.x} height={imgSize.y} />
								<canvas className="albumStage" id="img5" width={imgSize.x} height={imgSize.y} />
								<canvas className="albumStage" id="img6" width={imgSize.x} height={imgSize.y} />
								<ImgMap className="imgWithMap" src={previewImage} imgWidth={imgSize.x} width={this.state.canWidth} map={maps} onClick={area => spotClicked(area)} />
							</div>
							
							<img className="renderImg" id="renderImg" />
							
							<table className="leaderboard"></table>
							
							<div className="buttonContainer">
								<button className="startOverButton" onClick={this.startOver}>start over</button>
								<button className="renderButton" onClick={this.renderIt}>create album wall</button>
							</div>
							
							<div className="buttonContainer1">
								<button className="leaderboardButton" onClick={this.toggleLeader}>show leaderboard</button>
							</div>
						</main>
						
						<footer className="footer">
							<div>
								Powered by <a href="https://www.last.fm/home" target="_blank">Last.fm</a> and <a href="https://www.spotify.com" target="_blank">Spotify</a>.
							</div>
						</footer>
					</div>
				</div>
				<canvas className="renderCanvas" id="renderCanvas" width={fullImgSize.x} height={fullImgSize.y} src={renderedImage} />
			</>
		);
	};
}

class ImgMap extends ImageMapper{
	constructor(props){
		super(props)
	};
	
	componentDidMount(){
		spotClicked = spotClicked.bind(this);
	};
};
			
export default App;
