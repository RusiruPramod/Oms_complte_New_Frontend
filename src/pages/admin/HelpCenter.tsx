import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { NavLink } from "@/components/NavLink";
import { getAllInquiries } from "@/services/inquiryService";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import Pagination from '@/components/ui/paginations';

const HelpCenter = () => {
    const [inquiries, setInquiries] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem("adminAuthToken") || "";
                const data = await getAllInquiries(token);
                setInquiries(Array.isArray(data) ? data : []);
            } catch (err: any) {
                console.error(err);
                setError(err.message || "Failed to load inquiries");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);

    // Reset to first page when inquiries change
    useEffect(() => {
        setPage(1);
    }, [inquiries.length]);

    return (
        <AdminLayout>
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold">Help Center</h2>

                        <div className="flex items-center gap-3">
                            <NavLink to="/admin/inquiries" className="px-4 py-2 rounded-lg border" activeClassName="bg-primary text-primary-foreground">Inquiries</NavLink>

                            {/* Bell with red dot and count */}
                            <div className="relative">
                                <button aria-label="Inquiries" title="Inquiries" className="p-2 rounded-full hover:bg-gray-100">
                                    <Bell size={20} />
                                </button>

                                {inquiries.length > 0 && (
                                    <div className="absolute -top-0.5 -right-0.5 flex items-center justify-center">
                                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium leading-none text-white bg-red-600 rounded-full">{inquiries.length}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <p className="text-sm text-muted-foreground">Customer inquiries submitted via the order form.</p>

                    <div className="mt-6">
                        {loading && <div className="text-sm text-muted-foreground">Loading inquiries...</div>}
                        {error && <div className="text-sm text-destructive">{error}</div>}

                        {!loading && !error && (
                            <div>
                                {inquiries.length === 0 ? (
                                    <div className="text-sm text-muted-foreground">No inquiries found.</div>
                                ) : (
                                    <>
                                        <div className="space-y-3">
                                            {inquiries.slice((page - 1) * limit, page * limit).map((inq) => (
                                                <div key={inq.id || inq._id} className="p-3 border rounded-lg">
                                                    <div className="flex justify-between items-start gap-3">
                                                        <div className="text-sm text-gray-800">{inq.message}</div>
                                                        <div className="text-xs text-muted-foreground">{new Date(inq.created_at || inq.createdAt || Date.now()).toLocaleString()}</div>
                                                    </div>
                                                    {inq.mobile && <div className="text-xs text-muted-foreground mt-2">Mobile: {inq.mobile}</div>}
                                                </div>
                                            ))}
                                        </div>

                                        <Pagination
                                            total={inquiries.length}
                                            page={page}
                                            limit={limit}
                                            onPageChange={(p) => setPage(p)}
                                            onLimitChange={(l) => { setLimit(l); setPage(1); }}
                                            className="mt-4"
                                        />
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </AdminLayout>
    );
};

export default HelpCenter;
