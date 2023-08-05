import { context } from "../context";
import AWS, { CostExplorer, S3Outposts } from "aws-sdk";
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");

const size = 2;
let WIDTH = 720 * size;
let HEIGHT = 300 * size;
const image_num = 3;
let offset_i = 0;
let promises = [];

async function draw_image(s3_object, ctx, border_size, is_horizontal) {
	// 299 is the max border size
	const image = await loadImage(s3_object.Body);
	if (is_horizontal) {
		const width = (WIDTH - border_size * (image_num + 1)) / image_num;
		ctx.drawImage(
			image,
			offset_i,
			border_size,
			width,
			HEIGHT - border_size * 2
		);
		offset_i += width + border_size;
	} else {
		const height = (HEIGHT - border_size * (image_num + 1)) / image_num;
		ctx.drawImage(
			image,
			border_size,
			offset_i,
			WIDTH - border_size * 2,
			height
		);
		offset_i += height + border_size;
	}
}

export async function collage_image(ps) {
	const CONFIG = {
		endpoint: process.env.ENDPOINT,
		accessKeyId: process.env.ACCESS_KEY,
		secretAccessKey: process.env.SECRET_KEY,
		region: "default",
	};
	const s3 = new AWS.S3(CONFIG);
	const params1 = {
		Bucket: process.env.BUCKET,
		Key: ps.images[0],
	};
	const params2 = {
		Bucket: process.env.BUCKET,
		Key: ps.images[1],
	};
	const params3 = {
		Bucket: process.env.BUCKET,
		Key: ps.images[2],
	};

	try {
		const promise1 = s3.getObject(params1).promise();
		const promise2 = s3.getObject(params2).promise();
		const promise3 = s3.getObject(params3).promise();

		const all_done = Promise.all([promise1, promise2, promise3]);

		all_done.then((images) => {
			context.prisma.process
				.update({
					where: {
						id: ps.id,
					},
					data: {
						state: "DOING",
						log: ps.log + "images loaded\n",
					},
				})
				.then((updated_ps) => {
					if (ps.is_horizontal) {
						WIDTH = 720 * size;
						HEIGHT = 300 * size;
					} else {
						WIDTH = 300 * size;
						HEIGHT = 720 * size;
					}
					const canvas = createCanvas(WIDTH, HEIGHT);
					const ctx = canvas.getContext("2d");

					ctx.fillStyle = ps.bg_color;
					ctx.fillRect(0, 0, WIDTH, HEIGHT);

					offset_i = ps.border;

					promises.push(
						draw_image(images[0], ctx, ps.border, ps.is_horizontal)
					);
					promises.push(
						draw_image(images[1], ctx, ps.border, ps.is_horizontal)
					);
					promises.push(
						draw_image(images[2], ctx, ps.border, ps.is_horizontal)
					);

					const all_done = Promise.all(promises);
					all_done
						.then(() => {
							const key = `collage_${ps.id}.png`;
							const params = {
								Bucket: process.env.BUCKET,
								Key: key,
								Body: canvas.toBuffer(),
							};
							s3.putObject(params)
								.promise()
								.then(() => {
									const { Body, ...rest } = params;
									s3.getSignedUrl(
										"getObject",
										rest,
										(err, image_url) => {
											if (err)
												console.error(err, err.stack);
											context.prisma.process
												.update({
													where: {
														id: ps.id,
													},
													data: {
														output: image_url,
														state: "DONE",
														log:
															updated_ps.log +
															"images were drawn",
													},
												})
												.then(() => {
													console.log(
														"everythings done"
													);
												});
										}
									);
								});
						})
						.catch(console.log);
				})
				.catch(console.log);
		});
	} catch (error) {
		console.log(error);
	}
}
