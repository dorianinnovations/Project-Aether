import { api } from './api';

export interface Post {
  id: string;
  community: string;
  title: string;
  content?: string;
  author: string;
  authorArchetype?: string;
  time: string;
  engagement: string; // Legacy field
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  userHasLiked: boolean;
  badge: string;
  image?: string;
  comments: Comment[];
}

export interface Comment {
  id: string;
  author: string;
  authorArchetype?: string;
  content: string;
  time: string;
  profilePic?: string;
}

export interface CreatePostData {
  community: string;
  title: string;
  content?: string;
  badge?: string;
  image?: string;
}

export interface CreateCommentData {
  content: string;
}

export interface PostsResponse {
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export class PostsAPI {
  /**
   * Get posts with optional filtering and pagination
   */
  static async getPosts(params?: {
    page?: number;
    limit?: number;
    community?: string;
    search?: string;
    tab?: 'feed' | 'groups' | 'strategize' | 'collaborate';
  }): Promise<PostsResponse> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.community) searchParams.append('community', params.community);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.tab) searchParams.append('tab', params.tab);

    const response = await api.get(`/posts?${searchParams.toString()}`);
    return response.data;
  }

  /**
   * Get a single post by ID
   */
  static async getPost(postId: string): Promise<Post> {
    const response = await api.get(`/posts/${postId}`);
    return response.data;
  }

  /**
   * Create a new post
   */
  static async createPost(postData: CreatePostData): Promise<Post> {
    const response = await api.post('/posts', postData);
    return response.data;
  }

  /**
   * Update an existing post
   */
  static async updatePost(postId: string, updates: Partial<CreatePostData>): Promise<Post> {
    const response = await api.put(`/posts/${postId}`, updates);
    return response.data;
  }

  /**
   * Delete a post
   */
  static async deletePost(postId: string): Promise<{ message: string }> {
    const response = await api.delete(`/posts/${postId}`);
    return response.data;
  }

  /**
   * Add a comment to a post
   */
  static async addComment(postId: string, commentData: CreateCommentData): Promise<Comment> {
    const response = await api.post(`/posts/${postId}/comments`, commentData);
    return response.data;
  }

  /**
   * Delete a comment from a post
   */
  static async deleteComment(postId: string, commentId: string): Promise<{ message: string }> {
    const response = await api.delete(`/posts/${postId}/comments/${commentId}`);
    return response.data;
  }

  /**
   * Like or unlike a post
   */
  static async toggleLike(postId: string): Promise<{ message: string; liked: boolean; likesCount: number }> {
    const response = await api.post(`/posts/${postId}/like`);
    return response.data;
  }

  /**
   * Share a post (increment share count)
   */
  static async sharePost(postId: string): Promise<{ message: string; sharesCount: number }> {
    const response = await api.post(`/posts/${postId}/share`);
    return response.data;
  }
}