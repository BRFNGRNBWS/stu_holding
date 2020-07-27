import React from 'react';
import './App.scss';
import SearchBar from './SearchBar';
import $ from 'jquery';
import ImageMapper from 'react-image-mapper';
import Perspective from './perspective.js';

//coordinates of the corners of each cutout, expressed as a percentage of the image width/height
//format [x, y, x, y, x, y...]
//always start coords from the top left of where the album should be and go clockwise
const coordPercentages = [
	[0.74537, 0.32370, 0.83981, 0.32148, 0.84444, 0.39407, 0.74907, 0.39556],
	[0.28981, 0.34518, 0.75370, 0.35926, 0.72500, 0.70741, 0.28611, 0.70519]
];
//size of the preview image, mine is /public/stu_small.png
//the actual size of this image doesnt really matter, it will always be scaled to the page appropriately,
//i just scaled it down to this for data/loading time saving, and because it's the biggest it ever scales to on the page
const imgSize = {x: 486, y: 608};
const previewImage = "/stu_small.png";
//size of the full image, /public/stu.png
const fullImgSize = {x: 1080, y: 1350};
const fullImage = "/stu.png";
var scale = 1.0;
var maps = {name: "my-map", areas: []};
var placePicked = 0;
var albumsPicked = [];
var renderedImage = "";
genMaps();

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

function spotClicked(area){
	var number = parseInt(area["name"]);
	placePicked = number;
	for (var i = 0; i < maps["areas"].length; i++){
		if (i === placePicked)
			maps["areas"][i]["preFillColor"] = "rgba(255, 0, 0, 0.2)";
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
	};
	img.src = album["image"][album["image"].length - 1]["#text"];
};

function renderFinal(){
	var canvas = document.getElementById("renderCanvas");
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	for (var i = 0; i < coordPercentages.length; i++){
		renderImages(ctx, i);
	};
	
	/*var coords = calcCoords(0, fullImgSize);
	var img = new Image();
	img.crossOrigin = "anonymous";
	img.onload = function(){
		console.log("coords " + 0);
		console.log(coords);
		var p = new Perspective(ctx, img);
		console.log("Drawing " + img.src);
		p.draw(parseCoords(coords));
	};
	img.src = albumsPicked[0]["image"][albumsPicked[0]["image"].length - 1]["#text"];	
	console.log(img.src);
	
	var coords1 = calcCoords(1, fullImgSize);
	var img1 = new Image();
	img1.crossOrigin = "anonymous";
	img1.onload = function(){
		console.log("coords " + 1);
		console.log(coords1);
		var p1 = new Perspective(ctx, img1);
		console.log("Drawing " + img1.src);
		p1.draw(parseCoords(coords1));
	};
	img1.src = albumsPicked[1]["image"][albumsPicked[1]["image"].length - 1]["#text"];	
	console.log(img1.src);*/
	
	var img2 = new Image();
	img2.onload = function(){
		ctx.drawImage(img2, 0, 0);
	};
	img2.src = fullImage;
	
	//console.log(canvas.toDataURL());
};

function renderImages(ctx, i){
	console.log("i = " + i);
	var coords = calcCoords(i, fullImgSize);
	var img = new Image();
	img.crossOrigin = "anonymous";
	img.onload = function(){
		console.log("coords " + i);
		console.log(coords);
		var p = new Perspective(ctx, img);
		console.log("Drawing " + img.src);
		p.draw(parseCoords(coords));
	};
	img.src = albumsPicked[i]["image"][albumsPicked[i]["image"].length - 1]["#text"];	
	console.log(img.src);
};

$(document).ready(function(){
	spotClicked({name: "0"});
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
	};
	
	//updated when an album is picked from the search bar
	updateAlbum = (album) => {
		renderAlbum(album);
	};
	
	renderIt = (idk) => {
		renderFinal();
	};
	
	render(){
		return (
			<>
				<div className="parentContainer">
					<div className="container">
						<header className="header">
							<h1>Stu Holds</h1>
						</header>
						
						<main>
							<SearchBar className="albumText" selectedAlbum={this.updateAlbum} />
							
							<br />
							
							<div className="pictureHolder">
								<canvas className="albumStage" id="img0" width={imgSize.x} height={imgSize.y} />
								<canvas className="albumStage" id="img1" width={imgSize.x} height={imgSize.y} />
								<ImgMap className="imgWithMap" src={previewImage} imgWidth={imgSize.x} width={this.state.canWidth} map={maps} onClick={area => spotClicked(area)} />
							</div>
							<button onClick={this.renderIt}>render</button>
							<img className="renderImg" id="renderImg" />
						</main>
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
