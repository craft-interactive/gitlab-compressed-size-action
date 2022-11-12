import { getReadableFileSize } from "../file";

type Diff = ReturnType<typeof createDiff>;
type DiffStatus = "increased" | "decreased" | "unchanged" | "added";

const createDiff = ({
	id,
	sizes,
	threshold,
}: {
	id: string;
	sizes: { current: number; last: number };
	threshold: number | null;
}) => {
	const change = sizes.current - sizes.last;
	const hasChange = change !== 0;
	const hasIncrease = change > 0;
	let isBelowThreshold = true;
	let changeInPercent: string = "0";
	let status: DiffStatus = "unchanged";

	if (sizes.last) {
		if (hasChange) {
			if (hasIncrease) {
				status = "increased";
			} else {
				status = "decreased";
			}
			changeInPercent = Math.abs(
				((sizes.last - sizes.current) / sizes.last) * 100.0
			).toFixed(2);
		}
	} else {
		status = "added";
		changeInPercent = "100";
	}

	if (threshold) {
		isBelowThreshold = sizes.current <= threshold;
	}

	const prefix = hasChange ? (hasIncrease ? "+" : "-") : "";

	return {
		id,
		status,
		change: {
			raw: change,
			pretty: `${prefix}${getReadableFileSize(Math.abs(change))}`,
			percent: parseFloat(changeInPercent),
		},
		size: {
			raw: sizes.current,
			pretty: getReadableFileSize(sizes.current),
		},
		isBelowThreshold,
	};
};

export { Diff, DiffStatus, createDiff };
