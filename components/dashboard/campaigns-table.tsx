"use client";

import React, { useState, useMemo } from "react";
import { 
  Search, Filter, ArrowDown, ArrowUp, ArrowUpDown, 
  Download, FileText, LayoutGrid, CheckCircle 
} from "lucide-react";

interface CampaignRow {
  id: string;
  name: string;
  platform: string;
  spend: number;
  revenue: number;
  roas: number;
  conversions: number;
  clicks: number;
  impressions: number;
}

interface CampaignsTableProps {
  campaigns: CampaignRow[];
}

export function CampaignsTable({ campaigns }: CampaignsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [platformFilter, setPlatformFilter] = useState("ALL");
  const [sortField, setSortField] = useState<keyof CampaignRow>("spend");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const pageSize = 10;

  // Sorting handler
  const handleSort = (field: keyof CampaignRow) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Filtered and sorted data
  const processedCampaigns = useMemo(() => {
    let result = [...campaigns];

    // 1. Filter by search
    if (searchTerm) {
      result = result.filter((c) => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 2. Filter by platform
    if (platformFilter !== "ALL") {
      result = result.filter((c) => c.platform === platformFilter);
    }

    // 3. Sort
    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === "string") {
        return sortDirection === "asc" 
          ? (valA as string).localeCompare(valB as string)
          : (valB as string).localeCompare(valA as string);
      }

      return sortDirection === "asc"
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    });

    return result;
  }, [campaigns, searchTerm, platformFilter, sortField, sortDirection]);

  // Paginated campaigns
  const paginatedCampaigns = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return processedCampaigns.slice(startIndex, startIndex + pageSize);
  }, [processedCampaigns, currentPage]);

  const totalPages = Math.ceil(processedCampaigns.length / pageSize);

  // Client-side CSV Exporter
  const handleCSVExport = () => {
    setExporting(true);
    
    // Header columns
    const headers = ["Campaign Name", "Platform", "Spend ($)", "Revenue ($)", "ROAS", "Conversions", "Clicks", "Impressions"];
    
    // Rows
    const rows = campaigns.map((c) => [
      `"${c.name.replace(/"/g, '""')}"`,
      c.platform.replace("_", " "),
      c.spend.toFixed(2),
      c.revenue.toFixed(2),
      c.roas.toFixed(2),
      c.conversions,
      c.clicks,
      c.impressions
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    link.setAttribute("href", url);
    link.setAttribute("download", `PerformanceOS_Campaigns_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => setExporting(false), 800);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
  };

  return (
    <div className="glass-card rounded-[24px] border border-white/5 bg-white/[0.01] overflow-hidden">
      {/* Filtering Header Toolbar */}
      <div className="p-6 border-b border-white/[0.04] flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-[12px] bg-white/[0.02] border border-white/5 focus:border-purple-500/40 text-xs text-white placeholder:text-neutral-600 outline-none"
          />
        </div>

        <div className="flex w-full md:w-auto items-center justify-end gap-3">
          {/* Platform Filter Dropdown */}
          <div className="relative">
            <select
              value={platformFilter}
              onChange={(e) => {
                setPlatformFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none pl-3.5 pr-8 py-2 rounded-[12px] bg-white/[0.02] border border-white/5 focus:border-purple-500/40 text-xs text-neutral-300 outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-black text-white">All Platforms</option>
              <option value="GOOGLE_ADS" className="bg-black text-white">Google Ads</option>
              <option value="META_ADS" className="bg-black text-white">Meta Ads</option>
              <option value="LINKEDIN_ADS" className="bg-black text-white">LinkedIn Ads</option>
              <option value="MS_ADS" className="bg-black text-white">Microsoft Ads</option>
            </select>
            <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-neutral-500">
              <Filter className="w-3 h-3" />
            </span>
          </div>

          {/* Export Button */}
          <button
            onClick={handleCSVExport}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] bg-white text-black font-medium hover:bg-neutral-200 active:scale-95 transition text-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </div>

      {/* Campaigns Data Table Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-white/[0.04] bg-[#020203]/25 text-neutral-400 font-light">
              <th className="py-4 px-6 font-normal">
                <button onClick={() => handleSort("name")} className="flex items-center gap-1 hover:text-white cursor-pointer">
                  Campaign Name
                  {sortField === "name" ? (sortDirection === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3" />}
                </button>
              </th>
              <th className="py-4 px-6 font-normal">Platform</th>
              <th className="py-4 px-6 font-normal text-right">
                <button onClick={() => handleSort("spend")} className="flex items-center gap-1 hover:text-white ml-auto cursor-pointer">
                  Spend
                  {sortField === "spend" ? (sortDirection === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3" />}
                </button>
              </th>
              <th className="py-4 px-6 font-normal text-right">
                <button onClick={() => handleSort("revenue")} className="flex items-center gap-1 hover:text-white ml-auto cursor-pointer">
                  Revenue
                  {sortField === "revenue" ? (sortDirection === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3" />}
                </button>
              </th>
              <th className="py-4 px-6 font-normal text-right">
                <button onClick={() => handleSort("roas")} className="flex items-center gap-1 hover:text-white ml-auto cursor-pointer">
                  ROAS
                  {sortField === "roas" ? (sortDirection === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3" />}
                </button>
              </th>
              <th className="py-4 px-6 font-normal text-right">Conversions</th>
              <th className="py-4 px-6 font-normal text-right">Clicks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.02]">
            {paginatedCampaigns.map((c) => (
              <tr key={c.id} className="hover:bg-white/[0.01] text-neutral-300 transition duration-150">
                <td className="py-4 px-6 font-medium text-white truncate max-w-[240px]">{c.name}</td>
                <td className="py-4 px-6">
                  <span className={`inline-block px-2 py-0.5 rounded-[6px] text-[10px] font-semibold uppercase tracking-wider ${
                    c.platform === "GOOGLE_ADS" ? "bg-blue-950/40 border border-blue-500/20 text-blue-400" :
                    c.platform === "META_ADS" ? "bg-emerald-950/40 border border-emerald-500/20 text-emerald-400" :
                    c.platform === "LINKEDIN_ADS" ? "bg-purple-950/40 border border-purple-500/20 text-purple-400" :
                    "bg-yellow-950/40 border border-yellow-500/20 text-yellow-400"
                  }`}>
                    {c.platform.replace("_", " ")}
                  </span>
                </td>
                <td className="py-4 px-6 text-right font-mono">{formatCurrency(c.spend)}</td>
                <td className="py-4 px-6 text-right font-mono">{formatCurrency(c.revenue)}</td>
                <td className="py-4 px-6 text-right font-mono font-medium text-white">{c.roas.toFixed(2)}x</td>
                <td className="py-4 px-6 text-right font-mono">{c.conversions}</td>
                <td className="py-4 px-6 text-right font-mono">{c.clicks}</td>
              </tr>
            ))}
            {paginatedCampaigns.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-neutral-500 font-light">
                  No campaigns match the filter search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-white/[0.04] bg-[#020203]/10 flex items-center justify-between">
          <span className="text-[11px] text-neutral-500 font-light">
            Showing Page {currentPage} of {totalPages} ({processedCampaigns.length} campaigns)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-[8px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] text-[11px] disabled:opacity-40 transition cursor-pointer"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-[8px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] text-[11px] disabled:opacity-40 transition cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default CampaignsTable;
