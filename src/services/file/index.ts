import glob from "fast-glob";
import * as fs from "node:fs/promises";
import * as process from "node:process";
import * as gzip from "gzip-size";

type FileStat = { path: string; bytes: number };

const getFileStats = async (filepPatterns: string[]) => {
	const paths = await glob(filepPatterns);
	const stats = await Promise.all(
		paths.map(async (path): Promise<FileStat> => {
			const isCompressed = path.endsWith(".zip") || path.endsWith(".tar.gz");
			const relativePath = path.replace(process.cwd() + "/", "");

			if (!isCompressed) {
				return {
					path: relativePath,
					bytes: await gzip.file(path),
				};
			}

			const stat = await fs.stat(path);

			return {
				path: relativePath,
				bytes: stat.size,
			};
		})
	);

	return stats.sort((a, b) => a.path.localeCompare(b.path));
};

const k = 1024;
const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

const getReadableFileSize = (bytes: number, decimals = 2) => {
	if (!+bytes) return "0 Bytes";

	let isNegative = bytes < 0;

	bytes = Math.abs(bytes);

	const dm = decimals < 0 ? 0 : decimals;
	const index = Math.floor(Math.log(bytes) / Math.log(k));

	let pretty = "";

	pretty += `${parseFloat((bytes / Math.pow(k, index)).toFixed(dm))}`;
	pretty += ` `;
	pretty += `${sizes[index]}`;

	if (isNegative) {
		pretty = `-${pretty}`;
	}

	return pretty;
};

const parseReadableFileSize = (str: string) => {
	const size = sizes.find((size) =>
		str.toLowerCase().endsWith(size.toLowerCase())
	);
	const index = sizes.indexOf(size ?? "");
	const float = parseFloat(
		str.replaceAll(" ", "").replace(new RegExp(size ?? "", "gim"), "")
	);

	if (index === -1 || Number.isNaN(float)) {
		throw new Error(`Unable to detect size for "${str}"`);
	}

	return float * Math.pow(k, index);
};

export { FileStat, getFileStats, getReadableFileSize, parseReadableFileSize };
