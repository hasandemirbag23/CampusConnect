import { COMMUNITY_ACTIONS } from './constants/actionTypes';

export const initialCommunityState = {
  communities: [],
  joinedCommunities: [],
  activeCommunity: null,
  posts: [],
  isLoading: false,
};

export function communityReducer(state, action) {
  switch (action.type) {
    case COMMUNITY_ACTIONS.SET_COMMUNITIES:
      return { ...state, communities: action.payload, isLoading: false };
    case COMMUNITY_ACTIONS.SET_JOINED:
      return { ...state, joinedCommunities: action.payload };
    case COMMUNITY_ACTIONS.SET_ACTIVE:
      return { ...state, activeCommunity: action.payload };
    case COMMUNITY_ACTIONS.SET_POSTS:
      return { ...state, posts: action.payload, isLoading: false };
    case COMMUNITY_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case COMMUNITY_ACTIONS.UPDATE_POST:
      return {
        ...state,
        posts: state.posts.map((post) =>
          post.id === action.payload.id ? { ...post, ...action.payload } : post,
        ),
      };
    case COMMUNITY_ACTIONS.RESET:
      return initialCommunityState;
    default:
      return state;
  }
}
