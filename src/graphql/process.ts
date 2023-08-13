import {
	arg,
	booleanArg,
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
import dotenv from "dotenv";
import { create_rabbit_connection } from "../rabbitmq/rabbitmq";

dotenv.config();

const check_file_exist = async (s3, files: string[]) => {
	const promises = files.map((file) => {
		const params = {
			Bucket: process.env.BUCKET,
			Key: file,
		};
		return s3
			.headObject(params)
			.promise()
			.then(() => true)
			.catch(() => false);
	});
	const results = await Promise.all(promises);
	return results.every((result) => result === true);
};

const CONFIG = {
	endpoint: process.env.ENDPOINT,
	accessKeyId: process.env.ACCESS_KEY,
	secretAccessKey: process.env.SECRET_KEY,
	region: "default",
};

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
				is_horizontal: nonNull(booleanArg()),
			},
			async resolve(parent, args, context: Context) {
				try {
					const s3 = new AWS.S3(CONFIG);
					const all_files_exist = await check_file_exist(
						s3,
						args.images
					);
					if (all_files_exist) {
						const ps = await context.prisma.process.create({
							data: {
								images: args.images,
								bg_color: args.bg_color,
								border: args.border,
								is_horizontal: args.is_horizontal,
								log: "process created. pending...\n",
							},
						});
						const rabbit = await create_rabbit_connection();
						const message = JSON.stringify(ps);
						rabbit.channel.sendToQueue(
							process.env.RABBIT_PS_QUEUE,
							Buffer.from(message)
						);
						console.log("ps added.");
						return ps;
					} else {
						throw new Error(
							"Can not find all files that you requested"
						);
					}
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
				const s3 = new AWS.S3(CONFIG);

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

export const DownloadImage = extendType({
	type: "Query",
	definition(t) {
		t.nonNull.field("DownloadImage", {
			type: "String",
			args: {
				name: nonNull(stringArg()),
			},
			async resolve(parent, args, context) {
				const s3 = new AWS.S3(CONFIG);

				const bucket_name = process.env.BUCKET;
				const expiration = 60 * 10; // expires in 10 minutes

				const params = {
					Bucket: bucket_name,
					Key: args.name,
					Expires: expiration,
				};

				const image_url = await new Promise((resolve, reject) => {
					s3.getSignedUrl("getObject", params, (err, url) => {
						if (err) {
							console.error(err, err.stack);
							reject(err);
						} else {
							resolve(url);
						}
					});
				});

				return image_url;
			},
		});
	},
});

export const CancelProcess = extendType({
	type: "Mutation",
	definition(t) {
		t.nonNull.field("CancelProcess", {
			type: "Process",
			args: {
				id: nonNull(stringArg()),
			},
			resolve(parent, args, context: Context) {
				context.prisma.process
					.updateMany({
						where: {
							AND: [{ id: args.id }, { state: "PENDING" }],
						},
						data: {
							is_active: false,
						},
					})
					.then((ps) => {
						return ps;
					})
					.catch(console.log);
			},
		});
	},
});
