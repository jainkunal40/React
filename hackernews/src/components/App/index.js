import React, { Component } from 'react';
import axios from 'axios';
import './App.css';
import Button from '../Button';
import Search from '../Search';
import Table from '../Table';
import { DEFAULT_QUERY, DEFAULT_HPP, PATH_BASE, PATH_SEARCH, PARAM_SEARCH, PARAM_PAGE, PARAM_HPP,} from '../../constants';


class App extends Component {
    _isMounted = false;
    constructor(props) {
        super(props);
        this.state = {
            results: null,
            searchKey: '',
            searchTerm: DEFAULT_QUERY,
            error: null
        };
        this.needToSearchTopStories = this.needToSearchTopStories.bind(this);
        this.setSearchTopStories = this.setSearchTopStories.bind(this);
        this.onSearchChange= this.onSearchChange.bind(this);
        this.onDismiss = this.onDismiss.bind(this);
        this.fetchSearchTopStories = this.fetchSearchTopStories.bind(this);
        this.onSearchSubmit = this.onSearchSubmit.bind(this);
    }

    componentDidMount() {
        this._isMounted = true;
        const { searchTerm } = this.state;
        this.setState({ searchKey: searchTerm });
        this.fetchSearchTopStories(searchTerm);
    }    
    needToSearchTopStories(searchTerm) {
        return !this.state.results[searchTerm];
    }    
    setSearchTopStories(result) {
        const { hits, page } = result;
        const {searchKey, results} = this.state;        
        const oldHits = results && results[searchKey] ? results[searchKey].hits : [];        
        const updatedHits = [ ...oldHits, ...hits ];
        
        this.setState({ results : {...results, [searchKey]: { hits :updatedHits,page }} });
    }
    onSearchChange(event) {
        this.setState({searchTerm:event.target.value});
    }
    onDismiss(id) {
        const { searchKey, results } = this.state;
        const { hits,page } = results[searchKey];
        const updatedList = hits.filter(item => item.objectID !== id);
        this.setState({
            //ES 5
            //result:Object.assign({},this.state.result,{hits : updatedList})
            //ES 6
            results: {...results, [searchKey]: {hits : updatedList,page}} 
        });
    }    
    fetchSearchTopStories(searchTerm, page = 0) {
        axios(`${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${searchTerm}&${PARAM_PAGE}${page}&${PARAM_HPP}${DEFAULT_HPP}`)
        .then(result =>  this._isMounted && this.setSearchTopStories(result.data))
        .catch(error =>  this._isMounted && this.setState({ error }));
    }
    onSearchSubmit(event) {
        const { searchTerm } = this.state;
        this.setState({ searchKey: searchTerm });
        if(this.needToSearchTopStories(searchTerm)) {
            this.fetchSearchTopStories(searchTerm);
        }
        event.preventDefault();
    } 
    componentWillUnmount() {
        this._isMounted = false;
    }
    
    render() { 
        const { searchTerm, results, searchKey, error } = this.state;
        const page = (results && results[searchKey] && results[searchKey].page) || 0;
        const list = (results && results[searchKey] && results[searchKey].hits) || [];
        
        if (!list) { return null; }  
        return (
            <div className="page">
                <div className="interactions">
                    <Search value={searchTerm} onChange={this.onSearchChange} onSubmit={this.onSearchSubmit}>
                        Search
                    </Search>
                </div>
                {error ? 
                    <div className="interactions">
                        <p>Something went wrong.</p>
                    </div>
                    : list &&
                    <Table list={list} onDismiss={this.onDismiss} />
                }
                <div className="interactions">
                    <Button onClick={() => this.fetchSearchTopStories(searchKey, page + 1)}>
                        More
                    </Button>
                </div>           
            </div>
        );
    }
}