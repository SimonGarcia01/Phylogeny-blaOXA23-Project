export interface MatrixRequestListItem {
	id: number;
	name: string;
	requestedAt: string;
	finishedAt?: string;
	status: string;
}
