import {
	extendType,
	intArg,
	list,
	nonNull,
	objectType,
	stringArg,
} from "nexus";
import { NexusGenObjects } from "../../nexus-typegen";
import AWS from "aws-sdk";

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

const processes: NexusGenObjects["Process"][] = [
	{
		id: "1",
		images: ["image1", "image2", "image3"],
		output: "output",
		state: "PENDING",
		log: "log",
		created_at: "created at",
	},
	{
		id: "2",
		images: ["image12", "image22", "imag2e3"],
		output: "ouadfftput",
		state: "DONE",
		log: "losdfadfg",
		created_at: "creatasdfdfed at",
	},
];

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
				const { id, state } = args;
				return processes.filter((ps) => ps.state === state);
			},
		});
	},
});

export const ProcessMutation = extendType({
	type: "Mutation",
	definition(t) {
		t.nonNull.field("CreateProcess", {
			type: "Process",
			args: {
				images: nonNull(list(nonNull(stringArg()))),
				border: nonNull(intArg()),
				bg_color: nonNull(stringArg()),
			},
			resolve(parent, args, context) {
				// TODO: run real process and add it to datebase
				processes.push({
					id: (processes.length + 1).toString(),
					created_at: new Date().toString(),
					images: args.images,
					state: "PENDING",
				});

				return processes[processes.length - 1];
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
