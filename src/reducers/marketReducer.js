import { MARKET_ACTIONS } from './constants/actionTypes';

export const initialMarketState = {
  listings: [],
  myListings: [],
  savedListings: [],
  hasMore: true,
  isLoading: false,
  filters: { category: null, minPrice: null, maxPrice: null, status: 'active' },
  lastDoc: null,
};

export function marketReducer(state, action) {
  switch (action.type) {
    case MARKET_ACTIONS.SET_LISTINGS:
      return { ...state, listings: action.payload, isLoading: false };
    case MARKET_ACTIONS.APPEND_LISTINGS:
      return {
        ...state,
        listings: [...state.listings, ...action.payload.listings],
        lastDoc: action.payload.lastDoc,
        hasMore: action.payload.hasMore,
        isLoading: false,
      };
    case MARKET_ACTIONS.SET_MY_LISTINGS:
      return { ...state, myListings: action.payload };
    case MARKET_ACTIONS.SET_SAVED:
      return { ...state, savedListings: action.payload };
    case MARKET_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case MARKET_ACTIONS.SET_HAS_MORE:
      return { ...state, hasMore: action.payload };
    case MARKET_ACTIONS.SET_FILTERS:
      return { ...state, filters: { ...state.filters, ...action.payload }, lastDoc: null };
    case MARKET_ACTIONS.UPDATE_LISTING:
      return {
        ...state,
        listings: state.listings.map((listing) =>
          listing.id === action.payload.id ? { ...listing, ...action.payload } : listing,
        ),
      };
    case MARKET_ACTIONS.RESET:
      return initialMarketState;
    default:
      return state;
  }
}
