import JSZip from "jszip";

const parse = (fileName: string, contents: string) => {
	if (fileName.endsWith(".json")) {
		return JSON.parse(contents);
	}

	return contents;
};

const zip = {
	async extract(buffer: Buffer) {
		const zip = new JSZip();
		const results = await zip.loadAsync(buffer);

		return await Promise.all(
			Object.values(results.files)
				.filter((file) => file.dir !== true)
				.map(async (file) => ({
					name: file.name,
					contents: parse(file.name, await file.async("string")),
				}))
		);
	},
	async create(files: { name: string; contents: any }[]) {
		const zip = new JSZip();

		files.forEach((file) => zip.file(file.name, file.contents));

		return zip.generateAsync({ type: "nodebuffer" });
	},
};

export { zip };
