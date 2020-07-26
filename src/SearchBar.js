import React from 'react';
import $ from 'jquery';
import './SearchBar.scss';
import Autosuggest from 'react-autosuggest';

var suggs = [];

const renderSuggestion = suggestion => (
	<div className='searchContainer'>
		<img className='searchImage' src={suggestion.image[1]["#text"]} ></img>
		<div className='searchTextContainer'>
			<p>
				<span className='.searchName'>{suggestion.name}</span>
				<br/>
				<span className='.searchArtist'>{suggestion.artist}</span>
			</p>
		</div>
	</div>
);

function getSugg(value){
	var lastfm = getLastFM(value);

};

function getLastFM(value){
	var url = "https://ws.audioscrobbler.com/2.0/?method=album.search&album="
		+ value
		+ "&api_key=" + process.env.REACT_APP_LASTFM_KEY
		+ "&format=json&limit=4";
	
	$.ajax({url: url, success: function(response){
		//console.log("data");
		//console.log(data);
		suggs = response.results.albummatches.album;
		return suggs;
	}});
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
		getSugg(value);
		//console.log("suggs");
		//console.log(suggs);
		this.setState({
			suggestions: suggs
		});
	}
	
	//every time suggestions are cleard
	onSuggestionsClearRequested = () => {
		this.setState({
			suggestions: []
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
