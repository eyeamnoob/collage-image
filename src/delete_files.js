const AWS = require("aws-sdk");
const moment = require("moment");
require("dotenv").config();

async function delete_files(bucket_name, days_threshold) {
	const CONFIG = {
		endpoint: process.env.ENDPOINT,
		accessKeyId: process.env.ACCESS_KEY,
		secretAccessKey: process.env.SECRET_KEY,
		region: "default",
	};

	const s3 = new AWS.S3(CONFIG);

	const threshold_date = moment().subtract(days_threshold, "days");
	const list_params = {
		Bucket: bucket_name,
	};

	const objects = await s3.listObjectsV2(list_params).promise();

	for (const obj of objects.Contents || []) {
		const last_mod = moment(obj.LastModified);

		if (last_mod.isBefore(threshold_date)) {
			const delete_params = {
				Bucket: bucket_name,
				Key: obj.Key,
			};

			// await s3.deleteObject(delete_params).promise();
			console.log(`Deleted file: ${obj.Key}`);
		}
	}
}

const bucket_name = process.env.BUCKET;
const days_threshold = 3;

function wrapper() {
	delete_files(bucket_name, days_threshold)
		.then(() => {
			console.log("File deletion completed.");
		})
		.catch((error) => {
			console.error("Error deleting files:", error);
		});
}

wrapper();
setInterval(wrapper, days_threshold * 1000 * 86400);
