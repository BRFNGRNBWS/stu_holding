import React from 'react';
import './App.scss';
import SearchBar from './SearchBar';
import $ from 'jquery';

console.log(process.env.REACT_APP_LASTFM_KEY);

function genAutoComplete(item) {
	return "" +
		"<div class='searchContainer'>"+
		"<img class='searchImage' src=\"" + item["image"][1]["#text"] + "\"></img>" +
		"<div class='searchTextContainer'>" +
		"<p><span class='.searchName'>" + item["name"] + "</span><br>" +
		"<span class='.searchArtist'>" + item["artist"] + "</span></p>" +
		"</div>" +
		"</div>";
};

function resizeCanvas() {
	var canvas = document.getElementById("picture");
	var c = canvas.getContext("2d");
	var h = ($(canvas).width() / img.width) * img.height;
	$(canvas).height(h);
};
			
//var coordPercentages = [[0.28.981, 0.34518, 0.75370, 0.35926, 0.72500, 0.70741, 0.28611, 0.70519], []];

var img = new Image();

$(document).ready(function(){
	img.src = "/images/stu.png";
	console.log("document ready");
	img.onload = function(){
		console.log("onload");
		var canvas = document.getElementById("picture");
		var c = canvas.getContext("2d");
		var h = ($(canvas).width() / img.width) * img.height;
		c.imageSmoothingEnabled = false;
		$(canvas).height(h);
		c.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);	
	};
});
			
/*$(function (){
	var getLastFM = function (request, response) {
		$.getJSON(
			"https://ws.audioscrobbler.com/2.0/?method=album.search&album="
			+ request.term
			+ "&api_key=" + "<%=ENV['lastfm_api_key']%>"
			+ "&format=json&limit=4",
			function (data) {
				console.log(data);
				response(data["results"]["albummatches"]["album"]);
			}
		);
		
	};
	
	$(".albumText").autocomplete({
		source: getLastFM,
		minLength: 4,
		focus: function (event, ui) {
			$(".albumText").val(ui["item"]["name"]);
			return false;
		},
		select: function(event, ui) {
			console.log("select ui");
			console.log(ui);
			$(".albumText").val(ui["item"]["name"]);
			return false;
		}
	})
	.autocomplete("instance")._renderItem = function(ul, item) {
		console.log("item: ");
		console.log(item);
		return $("<li>")
			.append(genAutoComplete(item))
			.appendTo(ul);
	};
	
	$(window).resize(function(){
		resizeCanvas();
	});
});*/

function App() {
	return (
		<>
			<header className="header">
				<h1>Stu Holds</h1>
			</header>
			
			<main>
				<SearchBar className="albumText" />

				<canvas className="picture" id="picture" useMap="#pictureMap"></canvas>
				
				<map id="pictureMap">
					<area shape="poly" id="hole0"/>
					<area shape="poly" id="hole1"/>
				</map>
			</main>
		</>
	);
}

export default App;
