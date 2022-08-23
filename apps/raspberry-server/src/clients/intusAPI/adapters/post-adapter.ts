import { Post as LocalPost } from "../../../models/posts.model";
import { Post as APIPost } from "../intusAPI";

export default class PostAdapter {
  public static fromAPIToLocal(post: APIPost): LocalPost {
    return {
      _id: post.id,
      mediaId: post.media.id,
      startTime: post.start_time,
      endTime: post.end_time,
      showing: post.showing,
      startDate: post.start_date,
      endDate: post.end_date,
      exposeTime: post.expose_time,
      ...(post.recurrence && {
        recurrence: {
          isoweekday: post.recurrence.isoweekday,
          day: post.recurrence.day,
          month: post.recurrence.month,
          year: post.recurrence.year,
        },
      }),
    };
  }
}
