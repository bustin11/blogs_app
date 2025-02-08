export interface Post {
  heading: string;
  title: string,
  chapter: number,
  questions: string[],
  message: string;
  date: string; // or Date, depending on your needs
  updated_on: string;
  post_id: string;
  active_version: number,
  num_versions: number,
  tags: Tag[];
}

export interface BlogVersionApiResponse {
  post: Post;
}

export interface BlogApiResponse {
  size: number;
  posts: Post[];
}

export interface Tag {
  id: string;
  name: string;
}

export interface TagApiResponse {
  tags: Tag[]
}

export interface PostVersion {
  heading: string;
  title: string,
  chapter: number,
  questions: string[],
  message: string;
}