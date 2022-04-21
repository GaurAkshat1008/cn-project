import { Arg, Field, ObjectType, Query, Resolver } from "type-graphql";
import { Post } from "../entities/Post";
import { FieldError } from "./user";

@ObjectType()
class PostResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
  @Field(() => Post, { nullable: true })
  post?: Post;
}

@Resolver(Post)
export class PostResolver {
  @Query(() => PostResponse, { nullable: true })
  async post(@Arg("id") id: number): Promise<PostResponse> {
    const post = await Post.findOne(id);
    if (!post) {
      return {
        errors: [
          {
            field: "post",
            message: "404 not found",
          },
        ],
      };
    }
    return {
      post,
    };
  }
}
