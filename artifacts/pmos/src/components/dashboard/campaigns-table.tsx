import React, { useState, useMemo } from "react";
import { Search, ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

interface CampaignRow { id: string; name: string; platform: string; spend: number; revenue: number; roas: number; conversions: number; clicks: number; impressions: number; }

export function CampaignsTable({ campaigns }: { campaigns: CampaignRow[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [platformFilter, setPlatformFilter] = useState("ALL");
  const [sortField, setSortField] = useState<keyof CampaignRow>("spend");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const handleSort = (field: keyof CampaignRow) => {
    if (sortField === field) setSortDirection((p) => (p === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDirection("desc"); }
  };

  const platforms = ["ALL", ...Array.from(new Set(campaigns.map((c) => c.platform)))];

  const processed = useMemo(() => {
    let result = [...campaigns];
    if (searchTerm) result = result.filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (platformFilter !== "ALL") result = result.filter((c) => c.platform === platformFilter);
    result.sort((a, b) => {
      const valA = a[sortField], valB = b[sortField];
      if (typeof valA === "string") return sortDirection === "asc" ? (valA as string).localeCompare(valB as string) : (valB as string).localeCompare(valA as string);
      return sortDirection === "asc" ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
    return result;
  }, [campaigns, searchTerm, platformFilter, sortField, sortDirection]);

  const totalPages = Math.ceil(processed.length / pageSize);
  const paginated = processed.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatCurrency = (val: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
  const SortIcon = ({ field }: { field: keyof CampaignRow }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3" />;
    return sortDirection === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input type="search" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} placeholder="Search campaigns..." className="w-full pl-9 pr-4 py-2 rounded-[12px] bg-white/[0.02] border border-white/5 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-white/10" />
        </div>
        <select value={platformFilter} onChange={(e) => { setPlatformFilter(e.target.value); setCurrentPage(1); }} className="px-3 py-2 rounded-[12px] bg-white/[0.02] border border-white/5 text-xs text-neutral-300 outline-none focus:border-white/10">
          {platforms.map((p) => <option key={p} value={p} className="bg-neutral-900">{p === "ALL" ? "All Platforms" : p.replace("_", " ")}</option>)}
        </select>
      </div>

      <div className="glass-card rounded-[24px] border border-white/5 bg-white/[0.01] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.04] bg-[#020203]/25 text-neutral-400 font-light">
                {[{ label: "Campaign", field: "name" }, { label: "Platform", field: "platform" }, { label: "Spend", field: "spend" }, { label: "Revenue", field: "revenue" }, { label: "ROAS", field: "roas" }, { label: "Conversions", field: "conversions" }, { label: "Clicks", field: "clicks" }].map(({ label, field }) => (
                  <th key={field} className="py-3 px-4 font-normal cursor-pointer hover:text-white" onClick={() => handleSort(field as keyof CampaignRow)}>
                    <div className="flex items-center gap-1">{label}<SortIcon field={field as keyof CampaignRow} /></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {paginated.map((c) => (
                <tr key={c.id} className="text-neutral-300 hover:bg-white/[0.01] transition">
                  <td className="py-3 px-4 font-medium text-white truncate max-w-[180px]">{c.name}</td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/5 text-[10px] font-medium">{c.platform.replace("_", " ")}</span></td>
                  <td className="py-3 px-4 font-mono">{formatCurrency(c.spend)}</td>
                  <td className="py-3 px-4 font-mono">{formatCurrency(c.revenue)}</td>
                  <td className="py-3 px-4"><span className={`font-semibold ${c.roas >= 3 ? "text-emerald-400" : c.roas >= 1.5 ? "text-yellow-400" : "text-red-400"}`}>{c.roas.toFixed(2)}x</span></td>
                  <td className="py-3 px-4 font-mono">{c.conversions}</td>
                  <td className="py-3 px-4 font-mono">{c.clicks.toLocaleString()}</td>
                </tr>
              ))}
              {paginated.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-neutral-500 font-light">No campaigns match your filters.</td></tr>}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.04]">
            <span className="text-[10px] text-neutral-500">Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, processed.length)} of {processed.length}</span>
            <div className="flex gap-1">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 rounded-[8px] bg-white/[0.03] border border-white/5 text-[10px] text-neutral-400 hover:text-white disabled:opacity-40 cursor-pointer">Prev</button>
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded-[8px] bg-white/[0.03] border border-white/5 text-[10px] text-neutral-400 hover:text-white disabled:opacity-40 cursor-pointer">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CampaignsTable;
