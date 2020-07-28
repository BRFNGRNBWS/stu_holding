import React from 'react';
import $ from 'jquery';
import './SearchBar.scss';
import Autosuggest from 'react-autosuggest';

var suggs = [];
var date = new Date();
var lastFMRetry = 0;
var spotifyExpires = 0;
var spotifyToken = "";
//number of results to display in the search bar
var numOfResults = 4;
//number of minutes to switch between spotify and lastfm, change to 0 to just use lastfm
var switchEvery = 5;

const renderSuggestion = suggestion => (
	<div className='searchContainer'>
		<img className='searchImage' src={suggestion.image[0]["#text"]} height="100%" />
		<div className='searchTextContainer'>
			<p>
				<span className='.searchName'>{suggestion.name}</span>
				<br/>
				<span className='.searchArtist'>{suggestion.artist}</span>
			</p>
		</div>
	</div>
);

function getSuggs(value){
	var mins = date.getMinutes();
	if (Math.floor(mins / switchEvery) % 2 === 0)
		getSpotify(value, false);
	else
		getLastFM(value, false);
};

function getLastFM(value, fromSpotify){
	if (date.getTime() > lastFMRetry){
		var url = "https://ws.audioscrobbler.com/2.0/?method=album.search&album="
			+ value
			+ "&api_key=" + process.env.REACT_APP_LASTFM_KEY
			+ "&format=json&limit=" + numOfResults;
		
		$.ajax({url: url, dataType: 'json', success: function(response){
			//console.log("data");
			//console.log(data);
			suggs = response.results.albummatches.album;
		}, error: function(xhr, status, error){
			console.log("lastfm error, trying spotify");
			lastFMRetry = date.getTime() + (1 * 60 * 1000)
			if (!fromSpotify)
				getSpotify(value, true);
		}});
	} else {
		if (!fromSpotify)
			getSpotify(value, true);
	}
};

function getSpotify(value, fromLastFM){
	if (spotifyToken === "" || (date.getTime() > spotifyExpires && spotifyExpires !== 0)){
		$.ajax({
			url: "https://accounts.spotify.com/api/token",
			type: "post",
			data: {grant_type: "client_credentials"},
			headers: {
				Authorization: "Basic " + (new Buffer(process.env.REACT_APP_SPOTIFY_CLIENTID + ':' + process.env.REACT_APP_SPOTIFY_SECRET).toString('base64'))
			},
			dataType: 'json',
			success: function(data){
				spotifyToken = data["access_token"];
				spotifyExpires = date.getTime() + (data["expires_in"] * 1000);
			},
			error: function(data){
				console.log("Error getting spotify token, retrying lastfm");
				lastFMRetry = 0;
				suggs = [];
				if (!fromLastFM)
					getLastFM(value, true);
			}
		});
	};
	
	var url = "https://api.spotify.com/v1/search?q=" + value
		+ "&type=album&limit=" + numOfResults;
	
	$.ajax({url: url, dataType: "json", headers: {Authorization: "Bearer " + spotifyToken}, success: function(data){
		//console.log("url: " + url);
		suggs = spotifyToLast(data);
	},
	error: function(data){
		console.log("Error getting spotify search, trying lastfm");
		suggs = [];
		if (!fromLastFM)
			getLastFM(value, true);
	}});
};

//converts spotify response to the format of a lastfm response
function spotifyToLast(response){
	var output = [];
	response["albums"]["items"].forEach(album => {
		output.push({
			name: album["name"],
			artist: album["artists"][0]["name"],
			image: [
				{"#text": album["images"][album["images"].length - 1]["url"]},
				{"#text": album["images"][album["images"].length - 2]["url"]},
				{"#text": album["images"][0]["url"]}
			]
		});
	});
	console.log(output);
	return output;
};

class SearchBar extends React.Component {
	constructor(){
		super();
		this.state = {
			value: '',
			suggestions: []
		};
	};
	
	onChange = (event, {newValue, method}) => {
		this.setState({
			value: newValue
		});
	};
	
	//called every time suggestions need to be updated
	onSuggestionsFetchRequested = ({value}) => {
		getSuggs(value);
		if (suggs === undefined)
			suggs = [];
		this.setState({
			suggestions: suggs
		});
	}
	
	//every time suggestions are cleard
	onSuggestionsClearRequested = () => {
		this.setState({
			suggestions: [],
			value: ""
		});
	};
	
	//when a suggestion is clicked
	getSuggestionValue = (suggestion) => {
		this.props.selectedAlbum(suggestion);
		
		return suggestion.name;
	};
	
	render(){
		const {value, suggestions} = this.state;
		
		//all these props are passed to the input
		const inputProps = {
			placeholder: 'Type album or artist',
			value,
			onChange: this.onChange
		};
		
		return (
			<Autosuggest
				suggestions={suggestions}
				onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
				onSuggestionsClearRequested={this.onSuggestionsClearRequested}
				getSuggestionValue={this.getSuggestionValue}
				renderSuggestion={renderSuggestion}
				inputProps={inputProps}
			/>
		);
	};
};

export default SearchBar;
