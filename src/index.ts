import { ApolloServer } from "apollo-server";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import { schema } from "./schema";
import dotenv from "dotenv";

dotenv.config();

export const server = new ApolloServer({
	schema,
	plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
});

const port = 3000;

server.listen({ port }).then(({ url }) => {
	console.log(`🚀  Server ready at ${url}`);
});
