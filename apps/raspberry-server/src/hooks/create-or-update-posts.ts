// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
import { NotFound } from "@feathersjs/errors";
import { Hook, HookContext } from "@feathersjs/feathers";
import PostAdapter from "../clients/intusAPI/adapters/post-adapter";
import { Post } from "../clients/intusAPI/intusAPI";
import { Display } from "../models/displays.model";
import { Data as MediaData } from "../services/medias/medias.class";
import { Posts } from "../services/posts/posts.class";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (options = {}): Hook => {
	return async (context: HookContext): Promise<HookContext> => {
		const postsService: Posts = context.app.service("posts");
		const media: MediaData = context.data;
		const posts: Post[] = media.posts;
		const currentDisplay: Display = media.display;

		const res = await Promise.allSettled(
			posts.map(async (post: Post) => {
				try {
					const foundPost = await postsService.get(post.id);
					let postDisplays = foundPost.displays;

					const displaysAlreadyExists = postDisplays.find(
						display => display._id === currentDisplay._id
					);

					if (!displaysAlreadyExists) {
						postDisplays = [
							...foundPost.displays,
							{ _id: currentDisplay._id, showing: false },
						];
					}

					return postsService.update(foundPost._id, {
						...PostAdapter.fromAPIToLocal(post),
						displays: postDisplays,
						currentDisplay: { _id: currentDisplay._id, showing: false },
					});
				} catch (e) {
					if (e instanceof NotFound) {
						return postsService.create({
							...PostAdapter.fromAPIToLocal(post),
							displays: [{ _id: currentDisplay._id, showing: false }],
							currentDisplay: { _id: currentDisplay._id, showing: false },
						});
					}
				}
			})
		);

		return context;
	};
};
