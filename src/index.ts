import { ApolloServer } from "apollo-server";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import { schema } from "./schema";
import { context } from "./context";
import { Worker } from "node:worker_threads";

export const server = new ApolloServer({
	schema,
	plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
	context,
});

const worker = new Worker("./src/delete_files.js");

worker.on("error", console.log);

const port = 3000;

server.listen({ port }).then(({ url }) => {
	console.log(`🚀  Server ready at ${url}`);
});
