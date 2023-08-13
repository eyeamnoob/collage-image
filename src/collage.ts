import AWS from "aws-sdk";
import { createCanvas, loadImage } from "canvas";
import { create_rabbit_connection } from "./rabbitmq/rabbitmq";
import { context } from "./context";
import dotenv from "dotenv";

dotenv.config();

const size = 2;
let WIDTH = 720 * size;
let HEIGHT = 300 * size;
const image_num = 3;
let offset_i = 0;

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

async function collage_image(ps) {
	if (!ps.is_active) {
		return;
	}
	const CONFIG = {
		endpoint: process.env.ENDPOINT,
		accessKeyId: process.env.ACCESS_KEY,
		secretAccessKey: process.env.SECRET_KEY,
		region: "default",
	};
	const s3 = new AWS.S3(CONFIG);
	const params = [
		{ Bucket: process.env.BUCKET, Key: ps.images[0] },
		{ Bucket: process.env.BUCKET, Key: ps.images[1] },
		{ Bucket: process.env.BUCKET, Key: ps.images[2] },
	];

	try {
		const promises = params.map((param) => s3.getObject(param).promise());
		const images = await Promise.all(promises);

		await context.prisma.process.update({
			where: { id: ps.id },
			data: {
				state: "DOING",
				log: ps.log + "images loaded\n",
			},
		});

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

		await Promise.all([
			draw_image(images[0], ctx, ps.border, ps.is_horizontal),
			draw_image(images[1], ctx, ps.border, ps.is_horizontal),
			draw_image(images[2], ctx, ps.border, ps.is_horizontal),
		]);

		const output_key = `collage_${ps.id}.png`;
		const otuput_params = {
			Bucket: process.env.BUCKET,
			Key: output_key,
			Body: canvas.toBuffer(),
		};

		await s3.putObject(otuput_params).promise();

		await context.prisma.process.update({
			where: { id: ps.id },
			data: {
				output: output_key,
				state: "DONE",
				log: ps.log + "images were drawn",
			},
		});

		console.log("everything's done");
	} catch (error) {
		console.log(error);
	}
}

async function consume_message() {
	try {
		const rabbit = await create_rabbit_connection();

		const queue_name = process.env.RABBIT_PS_QUEUE;
		await rabbit.channel.assertQueue(queue_name, { durable: false });

		console.log("Waiting for messages...");

		rabbit.channel.consume(
			queue_name,
			async (message) => {
				if (message !== null) {
					const ps = JSON.parse(message.content.toString());
					console.log("Received ps:", ps);

					rabbit.channel.ack(message);
					await collage_image(ps);
				}
			},
			{ noAck: false }
		);
	} catch (error) {
		console.error("Error occurred:", error);
	}
}

consume_message();
