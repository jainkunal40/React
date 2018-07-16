    import React, { Component } from 'react';
    import axios from 'axios';
    import PropTypes from 'prop-types';
    import './App.css';
    import classNames from 'classnames';
    import { sortBy } from 'lodash';

    const largeColumn = {
      width: '40%',
    };
    const midColumn = {
      width: '30%',
    };
    const smallColumn = {
      width: '10%',
    };

    const DEFAULT_QUERY = 'redux';
    const DEFAULT_HPP = '100';
    const PATH_BASE = 'https://hn.algolia.com/api/v1';
    const PATH_SEARCH = '/search';
    const PARAM_SEARCH = 'query=';
    const PARAM_PAGE = 'page=';
    const PARAM_HPP = 'hitsPerPage=';
    //const url = `${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${DEFAULT_QUERY}&${PARAM_PAGE}`;

    const SORTS = {
      NONE: list => list,
      TITLE: list => sortBy(list, 'title'),
      AUTHOR: list => sortBy(list, 'author'),
      COMMENTS: list => sortBy(list, 'num_comments').reverse(),
      POINTS: list => sortBy(list, 'points').reverse(),
    };

    const updateSearchTopStoriesState = (hits, page) => (prevState) => {
      const { searchKey, results } = prevState;
      const oldHits = results && results[searchKey]
      ? results[searchKey].hits
      : [];
      const updatedHits = [
      ...oldHits,
      ...hits
      ];
      return {
      results: {
      ...results,
      [searchKey]: { hits: updatedHits, page }
      },
      isLoading: false
      };
      };


    class App extends Component {
      _isMounted = false;
      constructor(props) {
        super(props);
        this.state = {
          results: null,
          searchKey: '',
          searchTerm: DEFAULT_QUERY,
          error: null,
          isLoading: false,
          sortKey: 'NONE',
          isSortReverse: false  
        };
        this.needToSearchTopStories = this.needToSearchTopStories.bind(this);
        this.setSearchTopStories = this.setSearchTopStories.bind(this);
        this.onSearchChange= this.onSearchChange.bind(this);
        this.onDismiss = this.onDismiss.bind(this);
        this.fetchSearchTopStories = this.fetchSearchTopStories.bind(this);
        this.onSearchSubmit = this.onSearchSubmit.bind(this);
        this.onSort = this.onSort.bind(this);
      }
      
      needToSearchTopStories(searchTerm) {
        return !this.state.results[searchTerm];
      }
      
      setSearchTopStories(result) {
        const { hits, page } = result;
        this.setState(updateSearchTopStoriesState(hits, page));
      }
      
      fetchSearchTopStories(searchTerm, page = 0) {
        this.setState({ isLoading: true });
        axios(`${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${searchTerm}&${PARAM_PAGE}${page}&${PARAM_HPP}${DEFAULT_HPP}`)
        .then(result =>  this._isMounted && this.setSearchTopStories(result.data))
        .catch(error =>  this._isMounted && this.setState({ error }));
      }
      
      componentDidMount() {
        this._isMounted = true;
        const { searchTerm } = this.state;
        this.setState({ searchKey: searchTerm });
        this.fetchSearchTopStories(searchTerm);
      }
      
      componentWillUnmount() {
        this._isMounted = false;
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
      
      onSearchChange(event) {
        this.setState({searchTerm:event.target.value});
      }
      
      onSearchSubmit(event) {
        const { searchTerm } = this.state;
        this.setState({ searchKey: searchTerm });
        if(this.needToSearchTopStories(searchTerm)) {
          this.fetchSearchTopStories(searchTerm);
        }
        event.preventDefault();
      }
      
      onSort(sortKey) {
        const isSortReverse = this.state.sortKey === sortKey && !this.state.isSortReverse;
        this.setState({ sortKey, isSortReverse });
      }
      
      
      render() { 
        const { searchTerm, results, searchKey, error, isLoading, sortKey, isSortReverse } = this.state;
        const page = (results && results[searchKey] && results[searchKey].page) || 0;
        const list = (results && results[searchKey] && results[searchKey].hits) || [];
        
        if (!list) { return null; }  
        return (
          <div className="page">
          <div className="interactions">
          <Search
          value={searchTerm}
          onChange={this.onSearchChange}
          onSubmit={this.onSearchSubmit}>
          Search
          </Search>
          </div>
          {error ? <div className="interactions">
          <p>Something went wrong.</p>
          </div>:
          list &&
          <Table
          list={list}
          isSortReverse={isSortReverse}
          sortKey={sortKey}
          onSort={this.onSort}
          onDismiss={this.onDismiss}
          />
        }
        <div className="interactions">
        <ButtonWithLoading
        isLoading={isLoading}
        onClick={() => this.fetchSearchTopStories(searchKey, page + 1)}>
        More
        </ButtonWithLoading>
        
        </div>           
        </div>
      );
    }
    }

    const withLoading = (Component) => ({ isLoading, ...rest }) =>
    isLoading
    ? <Loading />
    : <Component { ...rest } />


    const Button = ({onClick, className = '', children}) =>
    <button 
    onClick = {onClick}
    className = {className}
    type = "button"
    >
    {children}
    </button>

    Button.defaultProps = {
      className: '',
    };

    Button.propTypes = {
      onClick: PropTypes.func.isRequired,
      className: PropTypes.string,
      children: PropTypes.node.isRequired,
    };
    const ButtonWithLoading = withLoading(Button);

    class Search extends Component {
      componentDidMount() {
        if(this.input) {
          this.input.focus();
        }
      }
      
      render() {
        const {
          value,
          onChange,
          onSubmit,
          children
        } = this.props;
        return (
          <form  onSubmit={onSubmit}>
          <input type="text" value={value} onChange={onChange} ref={(node) => { this.input = node; }}/>
          <button type="submit">
          {children}
          </button>
          </form>
        );
      }
    }
    
    const Sort = ({ sortKey, onSort, children, activeSortKey }) => 
    {
      const sortClass = classNames(
        'button-inline',
        { 'button-active': sortKey === activeSortKey }
        );
        return (
      <Button onClick={() => onSort(sortKey)} className={sortClass}>
        {children}
      </Button>
      );
    }
      


    const Table =({list, sortKey, onSort, onDismiss, isSortReverse}) =>
    {
      const sortedList = SORTS[sortKey](list);
      const reverseSortedList = isSortReverse
        ? sortedList.reverse()
        : sortedList;
        return(

    <div className="table">
    <div className="table-header">
    <span style={{ width: '40%' }}>
    <Sort
    sortKey={'TITLE'}
    onSort={onSort}
    activeSortKey={sortKey}
    >
    Title
    </Sort>
    </span>
    <span style={{ width: '30%' }}>
    <Sort
    sortKey={'AUTHOR'}
    onSort={onSort}
    activeSortKey={sortKey}
    >
    Author
    </Sort>
    </span>
    <span style={{ width: '10%' }}>
    <Sort
      sortKey={'COMMENTS'}
    onSort={onSort}
    activeSortKey={sortKey}
    >
    Comments
    </Sort>
    </span>
    <span style={{ width: '10%' }}>
    <Sort
    sortKey={'POINTS'}
    onSort={onSort}
    activeSortKey={sortKey}
    >
    Points
    </Sort>
    </span>
    <span style={{ width: '10%' }}>
    Archive
    </span>
    </div>
    {reverseSortedList.map(item => 
      <div key={item.objectID}  className="table-row">
      <span style={largeColumn}>
      <a href={item.url}>{item.title}</a>
      </span>
      <span style={midColumn}>
      {item.author}
      </span>
      <span style={smallColumn}>
      {item.num_comments}
      </span>
      <span style={smallColumn}>
      {item.points}
      </span>
      <span style={smallColumn}>
      <Button
      onClick={() => onDismiss(item.objectID)}
      className="button-inline"
      >
      Dismiss
      </Button>
      </span>
      </div>
    )}
    </div>
        );
    }

    Table.propTypes = {
      list: PropTypes.array.isRequired,
      onDismiss: PropTypes.func.isRequired,
    };
    const Loading = () =>
    <div>Loading ...</div>


    export default App;
    export {
      Button,
      Search,
      Table,
    };
