import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';

import { useAuth } from './AuthContext';
import { COMMUNITY_ACTIONS } from '../reducers/constants/actionTypes';
import { communityReducer, initialCommunityState } from '../reducers/communityReducer';
import { trackEvent } from '../services/analyticsService';
import {
  addPostComment,
  createCommunity,
  createPost,
  subscribeToJoinedCommunities,
  joinCommunity,
  leaveCommunity,
  subscribeToCommunities,
  subscribeToPosts,
} from '../services/communityService';
import { togglePostLike } from '../services/likeService';

const CommunityContext = createContext(null);

export function CommunityProvider({ children }) {
  const [state, dispatch] = useReducer(communityReducer, initialCommunityState);
  const { user, profile } = useAuth();

  useEffect(() => {
    dispatch({ type: COMMUNITY_ACTIONS.SET_LOADING, payload: true });
    const unsubscribe = subscribeToCommunities((communities) => {
      dispatch({ type: COMMUNITY_ACTIONS.SET_COMMUNITIES, payload: communities });
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      dispatch({ type: COMMUNITY_ACTIONS.SET_JOINED, payload: [] });
      return undefined;
    }
    let active = true;
    const unsub = subscribeToJoinedCommunities(user.uid, (joined) => {
      if (active) dispatch({ type: COMMUNITY_ACTIONS.SET_JOINED, payload: joined });
    });
    return () => {
      active = false;
      unsub();
    };
  }, [user]);

  const subscribePosts = useCallback((communityId) => {
    dispatch({ type: COMMUNITY_ACTIONS.SET_LOADING, payload: true });
    return subscribeToPosts(communityId, (posts) => {
      dispatch({ type: COMMUNITY_ACTIONS.SET_POSTS, payload: posts });
    });
  }, []);

  const setActiveCommunity = useCallback((community) => {
    dispatch({ type: COMMUNITY_ACTIONS.SET_ACTIVE, payload: community });
  }, []);

  const handleCreateCommunity = useCallback(
    async (data) => {
      if (!user) throw new Error('Giris gerekli');
      return createCommunity(data, { uid: user.uid, displayName: profile?.displayName || user.displayName });
    },
    [user, profile],
  );

  const handleJoin = useCallback(
    async (communityId) => {
      if (!user) throw new Error('Giris gerekli');
      await joinCommunity(communityId, user.uid);
      trackEvent('community_joined', { community_id: communityId });
    },
    [user],
  );

  const handleLeave = useCallback(
    async (communityId) => {
      if (!user) throw new Error('Giris gerekli');
      await leaveCommunity(communityId, user.uid);
    },
    [user],
  );

  const handleCreatePost = useCallback(
    async (communityId, content, imageURLs = []) => {
      if (!user) throw new Error('Giris gerekli');
      await createPost(
        communityId,
        {
          uid: user.uid,
          displayName: profile?.displayName || user.displayName,
          photoURL: profile?.photoURL || user.photoURL,
        },
        content,
        imageURLs,
      );
      trackEvent('post_created', { community_id: communityId });
    },
    [user, profile],
  );

  const handleLikePost = useCallback(async (communityId, postId, liked) => {
    await togglePostLike(communityId, postId, liked);
    trackEvent('post_liked', { community_id: communityId, post_id: postId });
  }, []);

  const handleAddComment = useCallback(
    async (communityId, postId, text) => {
      if (!user) throw new Error('Giris gerekli');
      await addPostComment(
        communityId,
        postId,
        {
          uid: user.uid,
          displayName: profile?.displayName || user.displayName,
          photoURL: profile?.photoURL || user.photoURL,
        },
        text,
      );
      trackEvent('comment_added', { community_id: communityId, post_id: postId });
    },
    [user, profile],
  );

  const reset = useCallback(() => {
    dispatch({ type: COMMUNITY_ACTIONS.RESET });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      joinedCommunities: state.joinedCommunities,
      setActiveCommunity,
      subscribePosts,
      createCommunity: handleCreateCommunity,
      joinCommunity: handleJoin,
      leaveCommunity: handleLeave,
      createPost: handleCreatePost,
      likePost: handleLikePost,
      addComment: handleAddComment,
      reset,
    }),
    [
      state,
      setActiveCommunity,
      subscribePosts,
      handleCreateCommunity,
      handleJoin,
      handleLeave,
      handleCreatePost,
      handleLikePost,
      handleAddComment,
      reset,
    ],
  );

  return <CommunityContext.Provider value={value}>{children}</CommunityContext.Provider>;
}

export function useCommunity() {
  const context = useContext(CommunityContext);
  if (!context) throw new Error('useCommunity CommunityProvider icinde kullanilmali');
  return context;
}
