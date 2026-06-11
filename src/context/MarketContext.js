import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import { useAuth } from './AuthContext';
import { MARKET_ACTIONS } from '../reducers/constants/actionTypes';
import { initialMarketState, marketReducer } from '../reducers/marketReducer';
import { trackEvent } from '../services/analyticsService';
import {
  createListing,
  deleteListing,
  fetchListingsPage,
  fetchMyListings,
  subscribeToMyListings,
  markAsSold,
  saveListing,
  subscribeToListings,
  subscribeToSavedListings,
  unsaveListing,
  updateListing,
} from '../services/marketService';
import { FLAT_LIST } from '../constants';

const MarketContext = createContext(null);

export function MarketProvider({ children }) {
  const [state, dispatch] = useReducer(marketReducer, initialMarketState);
  const { user, profile } = useAuth();
  const extraPagesRef = useRef([]);
  const lastDocRef = useRef(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    extraPagesRef.current = [];
    lastDocRef.current = null;
    dispatch({ type: MARKET_ACTIONS.SET_LOADING, payload: true });

    const unsubscribe = subscribeToListings(
      ({ listings, lastDoc, hasMore }) => {
        if (!active) return;
        lastDocRef.current = lastDoc;
        const merged = [...listings, ...extraPagesRef.current];
        const seen = new Set();
        const deduped = merged.filter((l) => {
          if (seen.has(l.id)) return false;
          seen.add(l.id);
          return true;
        });
        dispatch({ type: MARKET_ACTIONS.SET_LISTINGS, payload: deduped });
        dispatch({ type: MARKET_ACTIONS.SET_HAS_MORE, payload: hasMore || extraPagesRef.current.length > 0 });
      },
      state.filters,
      FLAT_LIST.PAGE_SIZE,
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [state.filters.category, state.filters.status, state.filters.minPrice, state.filters.maxPrice, refreshKey]);

  useEffect(() => {
    if (!user) {
      dispatch({ type: MARKET_ACTIONS.SET_MY_LISTINGS, payload: [] });
      dispatch({ type: MARKET_ACTIONS.SET_SAVED, payload: [] });
      return undefined;
    }
    fetchMyListings(user.uid).then((listings) => {
      dispatch({ type: MARKET_ACTIONS.SET_MY_LISTINGS, payload: listings });
    });
    const unsubMine = subscribeToMyListings(user.uid, (listings) => {
      dispatch({ type: MARKET_ACTIONS.SET_MY_LISTINGS, payload: listings });
    });
    const unsub = subscribeToSavedListings(user.uid, (saved) => {
      dispatch({ type: MARKET_ACTIONS.SET_SAVED, payload: saved });
    });
    return () => {
      unsubMine();
      unsub();
    };
  }, [user]);

  const loadMore = useCallback(async () => {
    if (!state.hasMore || state.isLoading || !lastDocRef.current) return;

    dispatch({ type: MARKET_ACTIONS.SET_LOADING, payload: true });
    try {
      const result = await fetchListingsPage(lastDocRef.current, state.filters);
      extraPagesRef.current = [...extraPagesRef.current, ...result.listings];
      lastDocRef.current = result.lastDoc;
      dispatch({
        type: MARKET_ACTIONS.SET_LISTINGS,
        payload: [...state.listings, ...result.listings.filter((l) => !state.listings.some((x) => x.id === l.id))],
      });
      dispatch({ type: MARKET_ACTIONS.SET_HAS_MORE, payload: result.hasMore });
    } finally {
      dispatch({ type: MARKET_ACTIONS.SET_LOADING, payload: false });
    }
  }, [state.hasMore, state.isLoading, state.filters, state.listings]);

  const refreshListings = useCallback(() => {
    extraPagesRef.current = [];
    lastDocRef.current = null;
    setRefreshKey((k) => k + 1);
  }, []);

  const loadMyListings = useCallback(async () => {
    if (!user) return;
    const listings = await fetchMyListings(user.uid);
    dispatch({ type: MARKET_ACTIONS.SET_MY_LISTINGS, payload: listings });
  }, [user]);

  const setFilters = useCallback((filters) => {
    extraPagesRef.current = [];
    lastDocRef.current = null;
    dispatch({ type: MARKET_ACTIONS.SET_FILTERS, payload: filters });
  }, []);

  const handleCreateListing = useCallback(
    async (data) => {
      if (!user) throw new Error('Giris gerekli');
      const id = await createListing(data, {
        uid: user.uid,
        displayName: profile?.displayName || user.displayName,
        photoURL: profile?.photoURL || user.photoURL,
        department: profile?.department || '',
      });
      trackEvent('listing_created', { listing_id: id });
      return id;
    },
    [user, profile],
  );

  const handleUpdateListing = useCallback(async (listingId, data) => {
    await updateListing(listingId, data);
  }, []);

  const handleDeleteListing = useCallback(async (listingId) => {
    await deleteListing(listingId);
    await loadMyListings();
  }, [loadMyListings]);

  const handleMarkAsSold = useCallback(
    async (listingId) => {
      await markAsSold(listingId);
      trackEvent('listing_sold', { listing_id: listingId });
      await loadMyListings();
    },
    [loadMyListings],
  );

  const handleSaveListing = useCallback(
    async (listingId, saved) => {
      if (!user) throw new Error('Giris gerekli');
      if (saved) {
        await saveListing(user.uid, listingId);
        trackEvent('listing_saved', { listing_id: listingId });
      } else {
        await unsaveListing(user.uid, listingId);
      }
    },
    [user],
  );

  const reset = useCallback(() => {
    extraPagesRef.current = [];
    lastDocRef.current = null;
    dispatch({ type: MARKET_ACTIONS.RESET });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      setFilters,
      loadMore,
      refreshListings,
      loadMyListings,
      createListing: handleCreateListing,
      updateListing: handleUpdateListing,
      deleteListing: handleDeleteListing,
      markAsSold: handleMarkAsSold,
      saveListing: handleSaveListing,
      reset,
    }),
    [
      state,
      setFilters,
      loadMore,
      refreshListings,
      loadMyListings,
      handleCreateListing,
      handleUpdateListing,
      handleDeleteListing,
      handleMarkAsSold,
      handleSaveListing,
      reset,
    ],
  );

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarket() {
  const context = useContext(MarketContext);
  if (!context) throw new Error('useMarket MarketProvider icinde kullanilmali');
  return context;
}
