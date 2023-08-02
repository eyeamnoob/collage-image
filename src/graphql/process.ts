import {
	extendType,
	intArg,
	list,
	nonNull,
	objectType,
	stringArg,
} from "nexus";
import AWS from "aws-sdk";
import { Context } from "../context";

export const Process = objectType({
	name: "Process",
	definition(t) {
		t.nonNull.string("id");
		t.nonNull.list.nonNull.string("images");
		t.string("output");
		t.nonNull.string("state");
		t.string("log");
		t.nonNull.string("created_at");
	},
});

export const ProcessQuery = extendType({
	type: "Query",
	definition(t) {
		t.nonNull.list.nonNull.field("processes", {
			type: "Process",
			args: {
				id: stringArg(),
				state: stringArg(),
			},
			resolve(parent, args, context) {
				// TODO: check one of args is provided not both. or maybe i'll remove id.
				const { id, state } = args;
				return processes.filter((ps) => ps.state === state);
			},
		});
	},
});

export const ProcessMutation = extendType({
	type: "Mutation",
	definition(t) {
		t.field("CreateProcess", {
			type: "Process",
			args: {
				images: nonNull(list(nonNull(stringArg()))),
				border: nonNull(intArg()),
				bg_color: nonNull(stringArg()),
			},
			async resolve(parent, args, context: Context) {
				// TODO: check if images exist
				try {
					const ps = await context.prisma.process.create({
						data: {
							images: args.images,
							bg_color: args.bg_color,
							border: args.border,
						},
					});
					return ps;
				} catch (error) {
					console.log(error);
					throw new Error("Failed to create process");
				}
			},
		});
	},
});

export const UploadImages = extendType({
	type: "Mutation",
	definition(t) {
		t.nonNull.field("UploadImage", {
			type: "String",
			args: {
				name: nonNull(stringArg()),
				mimetype: nonNull(stringArg()),
			},
			resolve(parent, args, context) {
				const config = {
					endpoint: process.env.ENDPOINT,
					accessKeyId: process.env.ACCESS_KEY,
					secretAccessKey: process.env.SECRET_KEY,
					region: "default",
				};

				const s3 = new AWS.S3(config);

				const bucket_name = process.env.BUCKET;
				const expiration = 60 * 10; // expires in 10 minutes

				const params = {
					Bucket: bucket_name,
					Key: args.name,
					Expires: expiration,
					ContentType: args.mimetype,
				};
				const signed_url = s3.getSignedUrl("putObject", params);

				return signed_url;
			},
		});
	},
});
