import amqp from "amqplib";
import dotenv from "dotenv";

dotenv.config();

let rabbit_conn;
let rabbit_channel;

export async function create_rabbit_connection() {
	try {
		if (rabbit_conn && rabbit_channel) {
			return { connection: rabbit_conn, channel: rabbit_channel };
		}

		const connection = await amqp.connect("amqp://localhost");
		const channel = await connection.createChannel();

		const queue_name = process.env.RABBIT_PS_QUEUE;
		await channel.assertQueue(queue_name, { durable: false });

		rabbit_conn = connection;
		rabbit_channel = channel;

		return { connection, channel };
	} catch (error) {
		console.error("Rabbit error:", error);
		throw error;
	}
}
