import { context } from "../context";
import AWS, { CostExplorer, S3Outposts } from "aws-sdk";
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");

const size = 2;
const WIDTH = 720 * size;
const HEIGHT = 300 * size;
const border_size = 12; // 299 is the maximum border size
const image_num = 3;
let i = 0;
let offset_i = border_size;

let promises = [];

async function draw_image(s3_object, ctx) {
	console.log("loading image...");
	console.log(s3_object.Body);
	const image = await loadImage(s3_object.Body);
	console.log("image ready to draw");
	const width = (WIDTH - border_size * (image_num + 1)) / image_num;
	ctx.drawImage(
		image,
		offset_i,
		border_size,
		width,
		HEIGHT - border_size * 2
	);
	console.log("image drawed");
	offset_i += width + border_size;
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
			const canvas = createCanvas(WIDTH, HEIGHT);
			const ctx = canvas.getContext("2d");

			ctx.fillStyle = "#ff0000";
			ctx.fillRect(0, 0, WIDTH, HEIGHT);

			promises.push(draw_image(images[0], ctx));
			promises.push(draw_image(images[1], ctx));
			promises.push(draw_image(images[2], ctx));

			const all_done = Promise.all(promises);
			all_done
				.then(() => {
					const params = {
						Bucket: process.env.BUCKET,
						Key: "collage.png",
						Body: canvas.toBuffer(),
					};
					s3.putObject(params)
						.promise()
						.then(() => {
							console.log("everythings done");
						});
				})
				.catch(console.log);
		});
	} catch (error) {
		console.log(error);
	}
}
