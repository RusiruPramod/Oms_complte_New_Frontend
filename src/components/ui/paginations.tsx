import React from 'react';

interface PaginationProps {
	total: number;
	page: number;
	limit: number;
	onPageChange: (page: number) => void;
	onLimitChange?: (limit: number) => void;
	limits?: number[];
	fixed?: boolean; // sticky bottom layout when true
	className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
	total,
	page,
	limit,
	onPageChange,
	onLimitChange,
	limits = [5, 10, 15, 20],
	fixed = false,
	className,
}) => {
	const totalPages = Math.max(1, Math.ceil(total / limit));

	const handlePageClick = (p: number) => {
		if (p < 1 || p > totalPages || p === page) return;
		onPageChange(p);
	};

	const renderPageNumbers = () => {
		// If few pages, render all
		if (totalPages <= 7) {
			return Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
				<button
					key={p}
					onClick={() => handlePageClick(p)}
					className={`px-3 py-1 rounded-md border ${p === page ? 'bg-primary text-white' : 'bg-white'}`}
				>
					{p}
				</button>
			));
		}

		// Otherwise use first, last, and window around current
		const pages: (number | string)[] = [];
		pages.push(1);
		let start = Math.max(2, page - 2);
		let end = Math.min(totalPages - 1, page + 2);

		if (start > 2) pages.push('...');

		for (let p = start; p <= end; p++) pages.push(p);

		if (end < totalPages - 1) pages.push('...');
		pages.push(totalPages);

		return pages.map((p, idx) =>
			typeof p === 'string' ? (
				<span key={`gap-${idx}`} className="px-2 text-sm text-muted-foreground">{p}</span>
			) : (
				<button
					key={p}
					onClick={() => handlePageClick(p)}
					className={`px-3 py-1 rounded-md border ${p === page ? 'bg-primary text-white' : 'bg-white'}`}
				>
					{p}
				</button>
			)
		);
	};

	// Compute visible range
	const start = total === 0 ? 0 : (page - 1) * limit + 1;
	const end = Math.min(total, page * limit);

	return (
		<div className={`w-full flex items-center justify-between ${className ?? 'mt-4'}`} aria-label="Pagination Navigation">
			<div className="text-sm text-muted-foreground">
				{total === 0 ? `Showing 0 of 0 results` : `Showing ${start}–${end} of ${total} results`}
			</div>

			<div className="inline-flex items-center gap-2 bg-white rounded-md shadow-sm border px-3 py-2">
				<button
					onClick={() => handlePageClick(page - 1)}
					disabled={page <= 1}
					className="px-3 py-1 rounded-md border border-gray-200 disabled:opacity-50 bg-white"
				>
					Prev
				</button>

				<div className="flex items-center gap-1">{renderPageNumbers()}</div>

				<button
					onClick={() => handlePageClick(page + 1)}
					disabled={page >= totalPages}
					className="px-3 py-1 rounded-md border border-gray-200 disabled:opacity-50 bg-white"
				>
					Next
				</button>

				{onLimitChange && (
					<select
						value={limit}
						onChange={(e) => onLimitChange && onLimitChange(parseInt(e.target.value, 10))}
						className="ml-3 rounded-md border px-2 py-1 bg-white"
					>
						{limits.map((l) => (
							<option key={l} value={l}>{l}</option>
						))}
					</select>
				)}
			</div>
		</div>
	);
};

export default Pagination;

