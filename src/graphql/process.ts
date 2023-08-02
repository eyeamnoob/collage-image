import {
	arg,
	enumType,
	extendType,
	intArg,
	list,
	nonNull,
	objectType,
	stringArg,
} from "nexus";
import AWS from "aws-sdk";
import { Context } from "../context";

const State = enumType({
	name: "State",
	members: ["DONE", "DOING", "PENDING"],
});

export const Process = objectType({
	name: "Process",
	definition(t) {
		t.nonNull.string("id");
		t.nonNull.list.nonNull.string("images");
		t.string("output");
		t.nonNull.field("state", { type: State });
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
				state: arg({
					type: State,
				}),
			},
			async resolve(parent, args, context: Context) {
				try {
					const pss = await context.prisma.process.findMany({
						where: {
							state: args.state,
						},
					});
					return pss;
				} catch (error) {
					console.log(error);
					throw new Error("Failed to get processes");
				}
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
