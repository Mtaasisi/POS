import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Grid3X3, Plus, Search, Trash2, Copy, Download, ChevronRight, ChevronDown } from "lucide-react";
import { toast } from "react-hot-toast";
import GlassButton from "../../../../features/shared/components/ui/GlassButton";
import { supabase } from "../../../../lib/supabaseClient";
import { storeLocationApi } from "../../../../features/settings/utils/storeLocationApi";

type UUID = string;

interface StorageRoom {
  id: UUID;
  store_location_id: UUID;
  name: string;
  code: string; // e.g. "01"
  floor_level: number | null;
  created_at?: string;
  updated_at?: string;
}

interface StoreLocation {
  id: UUID;
  name: string;
  code?: string | null;
  address_line?: string | null;
  city?: string | null;
}

interface StoreShelf {
  id: UUID;
  store_location_id: UUID;
  storage_room_id: UUID;
  name: string;
  code: string; // e.g. "01A1"
  shelf_type?: string | null;
  row_number?: number | null;
  column_number?: number | null;
  floor_level?: number | null;
  is_active?: boolean | null;
  is_accessible?: boolean | null;
  requires_ladder?: boolean | null;
  is_refrigerated?: boolean | null;
  priority_order?: number | null;
  created_at?: string;
  updated_at?: string;
}

// New interface for grouped shelf configurations
interface ShelfGroup {
  id: string;
  rows: number;
  columns: number;
  quantity: number;
  shelves: StoreShelf[];
  collapsed: boolean;
  startRow: string;
  endRow: string;
  startCol: number;
  endCol: number;
}

/** Helpers */
const ROWS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const letterToIndex = (letter: string) =>
  Math.max(1, ROWS.indexOf((letter || "A").toUpperCase()) + 1);
const indexToLetter = (idx: number) => ROWS[(idx - 1) % 26] || String(idx);
const makeShelfCode = (roomCode: string, rowLetter: string, columnNumber: number) =>
  `${roomCode}${(rowLetter || "A").toUpperCase()}${columnNumber}`;

const parseShelfToRowCol = (shelf: StoreShelf, fallbackRoomCode?: string) => {
  // Prefer stored row/column if present
  if (shelf.row_number && shelf.column_number) {
    return { rowLetter: indexToLetter(shelf.row_number), col: shelf.column_number };
  }
  // Otherwise parse from code (expects e.g. "01A12")
  const code = shelf.code || "";
  const roomCode = (fallbackRoomCode || "").toUpperCase();
  const afterRoom = code.toUpperCase().startsWith(roomCode)
    ? code.slice(roomCode.length)
    : code;
  const rowLetter = afterRoom.slice(0, 1) || "A";
  const col = Number(afterRoom.slice(1)) || shelf.column_number || 1;
  return { rowLetter, col };
};

const downloadCSV = (filename: string, rows: Record<string, unknown>[]) => {
  if (!rows.length) return toast.error("Hakuna data ya ku-export");
  const headers = Object.keys(rows[0]);
  const escape = (val: unknown) => {
    if (val === null || val === undefined) return "";
    const s = String(val);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const csv = [headers.join(","), ...rows.map(r => headers.map(h => escape(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.setAttribute("download", filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success("CSV imetengenezwa");
};

const StorageRoomDetails: React.FC = () => {
  const { id: roomId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [room, setRoom] = useState<StorageRoom | null>(null);
  const [location, setLocation] = useState<StoreLocation | null>(null);
  const [shelves, setShelves] = useState<StoreShelf[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [rowFilter, setRowFilter] = useState<string>("");

  // Quick add / generator state
  const [showAdd, setShowAdd] = useState(false);
  const [newShelf, setNewShelf] = useState<{ row_letter: string; column_number: number }>({
    row_letter: "A",
    column_number: 1,
  });

  const [rowConfig, setRowConfig] = useState<{ row_letter: string; columns: number }[]>([]);
  const [showGenerator, setShowGenerator] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  /** Load room, location and shelves */
  useEffect(() => {
    const run = async () => {
      if (!roomId) {
        toast.error("Missing room id");
        return;
      }
      setLoading(true);
      try {
        if (!supabase) throw new Error("Database connection not available");
        
        // Room
        const { data: roomData, error: roomErr } = await supabase
          .from("lats_storage_rooms")
          .select("*")
          .eq("id", roomId)
          .single();
        if (roomErr) throw roomErr;
        setRoom(roomData);

        // Location
        try {
          const loc = await storeLocationApi.getById(roomData.store_location_id);
          setLocation(loc || null);
        } catch {
          // fallback via supabase
          if (supabase) {
            const { data: locData } = await supabase
              .from("lats_store_locations")
              .select("*")
              .eq("id", roomData.store_location_id)
              .maybeSingle();
            setLocation(locData || null);
          }
        }

        // Shelves
        const { data: shelfData, error: shelfErr } = await supabase
          .from("lats_store_shelves")
          .select("*")
          .eq("storage_room_id", roomId)
          .order("priority_order", { ascending: true })
          .order("row_number", { ascending: true })
          .order("column_number", { ascending: true });
        if (shelfErr) throw shelfErr;
        setShelves(shelfData || []);
      } catch (e: unknown) {
        console.error(e);
        toast.error("Failed to load room details");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [roomId]);

  const uniqueRowLetters = useMemo(() => {
    const set = new Set<string>();
    shelves.forEach(s => {
      const { rowLetter } = parseShelfToRowCol(s, room?.code);
      set.add(rowLetter);
    });
    return Array.from(set).sort((a, b) => letterToIndex(a) - letterToIndex(b));
  }, [shelves, room?.code]);

  const filteredShelves = useMemo(() => {
    let list = shelves;
    if (rowFilter) {
      list = list.filter(s => parseShelfToRowCol(s, room?.code).rowLetter === rowFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        s =>
          s.code.toLowerCase().includes(q) ||
          (s.name || "").toLowerCase().includes(q)
      );
    }
    // Stable visual order
    return [...list].sort((a, b) => {
      const A = parseShelfToRowCol(a, room?.code);
      const B = parseShelfToRowCol(b, room?.code);
      if (A.rowLetter === B.rowLetter) return (A.col || 0) - (B.col || 0);
      return letterToIndex(A.rowLetter) - letterToIndex(B.rowLetter);
    });
  }, [shelves, rowFilter, search, room?.code]);

  // Group shelves by their configuration (rows × columns × quantity)
  const shelfGroups = useMemo(() => {
    if (!room) return [];
    
    const groups: ShelfGroup[] = [];
    const processedShelves = new Set<string>();
    
    shelves.forEach(shelf => {
      if (processedShelves.has(shelf.id)) return;
      
      const { rowLetter, col } = parseShelfToRowCol(shelf, room.code);
      const rowIndex = letterToIndex(rowLetter);
      
      // Find shelves that belong to the same configuration
      const relatedShelves = shelves.filter(s => {
        const sRowCol = parseShelfToRowCol(s, room.code);
        return sRowCol.rowLetter === rowLetter;
      });
      
      if (relatedShelves.length > 0) {
        const maxCol = Math.max(...relatedShelves.map(s => parseShelfToRowCol(s, room.code).col || 0));
        const minCol = Math.min(...relatedShelves.map(s => parseShelfToRowCol(s, room.code).col || 0));
        const rows = relatedShelves.length > 0 ? 1 : 0; // For now, assume single row per group
        const columns = maxCol - minCol + 1;
        const quantity = 1; // Default quantity
        
        const groupId = `${rowLetter}-${minCol}-${maxCol}`;
        
        groups.push({
          id: groupId,
          rows,
          columns,
          quantity,
          shelves: relatedShelves,
          collapsed: collapsedGroups.has(groupId),
          startRow: rowLetter,
          endRow: rowLetter,
          startCol: minCol,
          endCol: maxCol
        });
        
        // Mark all related shelves as processed
        relatedShelves.forEach(s => processedShelves.add(s.id));
      }
    });
    
    return groups.sort((a, b) => letterToIndex(a.startRow) - letterToIndex(b.startRow));
  }, [shelves, room, collapsedGroups]);

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  /** Actions */
  const handleAddShelf = async () => {
    if (!room || !location) return;
    if (!newShelf.row_letter || !newShelf.column_number) {
      return toast.error("Weka row letter na column number");
    }
    const code = makeShelfCode(room.code, newShelf.row_letter, newShelf.column_number);
    if (shelves.some(s => s.code === code)) {
      return toast.error("Shelf hii tayari ipo");
    }
    const payload: Partial<StoreShelf> = {
      store_location_id: room.store_location_id,
      storage_room_id: room.id,
      name: `Shelf ${newShelf.row_letter}${newShelf.column_number}`,
      code,
      shelf_type: "standard",
      row_number: letterToIndex(newShelf.row_letter),
      column_number: newShelf.column_number,
      floor_level: room.floor_level || 1,
      is_active: true,
      is_accessible: true,
      requires_ladder: false,
      is_refrigerated: false,
      priority_order: (letterToIndex(newShelf.row_letter) - 1) * 100 + newShelf.column_number,
    };
    if (!supabase) throw new Error("Database connection not available");
    
    const { data, error } = await supabase
      .from("lats_store_shelves")
      .insert(payload)
      .select("*")
      .single();
    if (error) {
      console.error(error);
      toast.error("Imeshindikana kuongeza shelf");
      return;
    }
    setShelves(prev => [...prev, data as StoreShelf]);
    setShowAdd(false);
    toast.success("Shelf imeongezwa");
  };

  const handleDeleteShelf = async (shelf: StoreShelf) => {
    if (!confirm(`Futa shelf ${shelf.code}?`)) return;
    if (!supabase) throw new Error("Database connection not available");
    
    const { error } = await supabase.from("lats_store_shelves").delete().eq("id", shelf.id);
    if (error) {
      console.error(error);
      return toast.error("Imeshindikana kufuta shelf");
    }
    setShelves(prev => prev.filter(s => s.id !== shelf.id));
    toast.success("Imefutwa");
  };

  const handleGenerateFromRows = async () => {
    if (!room) return;
    if (!rowConfig.length) return toast.error("Ongeza angalau row moja");
    const existing = new Set(shelves.map(s => s.code));
    const toInsert: Partial<StoreShelf>[] = [];
    rowConfig.forEach(r => {
      const L = (r.row_letter || "A").toUpperCase();
      for (let c = 1; c <= Math.max(1, r.columns || 1); c++) {
        const code = makeShelfCode(room.code, L, c);
        if (!existing.has(code)) {
          toInsert.push({
            store_location_id: room.store_location_id,
            storage_room_id: room.id,
            name: `Shelf ${L}${c}`,
            code,
            shelf_type: "standard",
            row_number: letterToIndex(L),
            column_number: c,
            floor_level: room.floor_level || 1,
            is_active: true,
            is_accessible: true,
            requires_ladder: false,
            is_refrigerated: false,
            priority_order: (letterToIndex(L) - 1) * 100 + c,
          });
        }
      }
    });
    if (!toInsert.length) {
      return toast("Hakuna shelf mpya za kuunda (zipo tayari)", { icon: "ℹ️" });
    }
    if (!supabase) throw new Error("Database connection not available");
    
    const { data, error } = await supabase.from("lats_store_shelves").insert(toInsert).select("*");
    if (error) {
      console.error(error);
      return toast.error("Imeshindikana kutengeneza shelves");
    }
    setShelves(prev => [...prev, ...(data as StoreShelf[])]);
    setShowGenerator(false);
    toast.success(`Shelves ${toInsert.length} zimeundwa`);
  };

  const countsByRow = useMemo(() => {
    const map = new Map<string, number>();
    shelves.forEach(s => {
      const { rowLetter } = parseShelfToRowCol(s, room?.code);
      map.set(rowLetter, (map.get(rowLetter) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => letterToIndex(a[0]) - letterToIndex(b[0]))
      .map(([row, count]) => ({ row, count }));
  }, [shelves, room?.code]);

  const maxColumnsInRow = (letter: string) => {
    let max = 0;
    shelves.forEach(s => {
      const parsed = parseShelfToRowCol(s, room?.code);
      if (parsed.rowLetter === letter) max = Math.max(max, parsed.col || 0);
    });
    return max;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse text-gray-500">Loading room details...</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="p-6">
        <GlassButton onClick={() => navigate(-1)} variant="secondary">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </GlassButton>
        <div className="mt-4 text-red-600">Room not found.</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GlassButton onClick={() => navigate(-1)} variant="secondary">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </GlassButton>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            <div>
              <div className="text-xl font-semibold text-gray-900">
                {room.code}
              </div>
              <div className="text-sm text-gray-600">
                {location?.name || "—"} {" · "} Floor {room.floor_level || 1} {" · "}
                {shelves.length} shelves
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GlassButton
            onClick={() =>
              downloadCSV(
                `shelves_${room.code}.csv`,
                shelves.map(s => ({
                  id: s.id,
                  shelf_code: s.code,
                  shelf_name: s.name,
                  row: parseShelfToRowCol(s, room.code).rowLetter,
                  column: parseShelfToRowCol(s, room.code).col,
                  floor_level: s.floor_level ?? "",
                  type: s.shelf_type ?? "",
                  is_active: s.is_active ? "yes" : "no",
                }))
              )
            }
            variant="secondary"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </GlassButton>
          <GlassButton onClick={() => setShowGenerator(v => !v)} variant="secondary">
            <Grid3X3 className="w-4 h-4 mr-2" />
            {showGenerator ? "Close Generator" : "Generate Layout"}
          </GlassButton>
          <GlassButton onClick={() => setShowAdd(v => !v)} className="bg-blue-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            {showAdd ? "Close Add" : "Add Shelf"}
          </GlassButton>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border bg-white shadow-sm">
          <div className="text-xs text-gray-500">Store Location</div>
          <div className="text-sm font-medium">{location?.name || "—"}</div>
        </div>
        <div className="p-4 rounded-xl border bg-white shadow-sm">
          <div className="text-xs text-gray-500">Floor Level</div>
          <div className="text-sm font-medium">{room.floor_level || 1}</div>
        </div>
        <div className="p-4 rounded-xl border bg-white shadow-sm">
          <div className="text-xs text-gray-500">Total Shelves</div>
          <div className="text-sm font-medium">{shelves.length}</div>
        </div>
        <div className="p-4 rounded-xl border bg-white shadow-sm">
          <div className="text-xs text-gray-500">Shelf Groups</div>
          <div className="text-sm font-medium">
            {shelfGroups.length} 
            <span className="text-xs text-gray-500 ml-1">
              ({shelfGroups.filter(g => !g.collapsed).length} expanded)
            </span>
          </div>
        </div>
        <div className="p-4 rounded-xl border bg-white shadow-sm">
          <div className="text-xs text-gray-500">Total Positions</div>
          <div className="text-sm font-medium">
            {shelfGroups.reduce((total, group) => total + (group.rows * group.columns * group.quantity), 0)}
          </div>
        </div>
      </div>

      {/* Generator */}
      {showGenerator && (
        <div className="p-4 rounded-xl border bg-white shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-medium text-gray-800">Shelf Layout Generator</div>
            <GlassButton onClick={() => setRowConfig(prev => [...prev, { row_letter: "A", columns: 1 }])} variant="secondary">
              <Plus className="w-4 h-4 mr-2" /> Add Row
            </GlassButton>
          </div>
          {rowConfig.length ? (
            <div className="space-y-2">
              {rowConfig.map((r, idx) => (
                <div key={idx} className="p-3 rounded-lg border bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">
                      Row {r.row_letter} • {r.columns} columns
                    </div>
                    <button
                      onClick={() => setRowConfig(prev => prev.filter((_, i) => i !== idx))}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">Row Letter</span>
                      <input
                        value={r.row_letter}
                        maxLength={1}
                        onChange={e => {
                          const L = e.target.value.toUpperCase().slice(0, 1) || "A";
                          setRowConfig(prev => prev.map((row, i) => (i === idx ? { ...row, row_letter: L } : row)));
                        }}
                        className="w-16 px-2 py-1 text-sm border rounded"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">Columns</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={r.columns}
                        onChange={e => {
                          const c = Math.max(1, Math.min(100, Number(e.target.value) || 1));
                          setRowConfig(prev => prev.map((row, i) => (i === idx ? { ...row, columns: c } : row)));
                        }}
                        className="w-24 px-2 py-1 text-sm border rounded"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <div>
                <GlassButton onClick={handleGenerateFromRows} className="bg-purple-600 text-white">
                  <Grid3X3 className="w-4 h-4 mr-2" />
                  Generate Shelves
                </GlassButton>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg border text-sm text-gray-500 text-center">No rows yet. Click "Add Row".</div>
          )}
        </div>
      )}

      {/* Quick Add */}
      {showAdd && (
        <div className="p-4 rounded-xl border bg-white shadow-sm">
          <div className="text-sm font-medium mb-3">Add Shelf</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Row Letter</label>
              <input
                value={newShelf.row_letter}
                maxLength={1}
                onChange={e => setNewShelf(p => ({ ...p, row_letter: e.target.value.toUpperCase().slice(0, 1) || "A" }))}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="A"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Column Number</label>
              <input
                type="number"
                min={1}
                value={newShelf.column_number}
                onChange={e => setNewShelf(p => ({ ...p, column_number: Math.max(1, parseInt(e.target.value) || 1) }))}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Auto Code</label>
              <input
                disabled
                className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                value={makeShelfCode(room.code, newShelf.row_letter || "A", newShelf.column_number || 1)}
              />
            </div>
          </div>
          <div className="mt-3">
            <GlassButton onClick={handleAddShelf} className="bg-green-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Save Shelf
            </GlassButton>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search code or name…"
            className="w-full pl-9 pr-3 py-2 border rounded-lg"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setRowFilter("")}
            className={`px-3 py-1 rounded-lg border text-sm ${!rowFilter ? "bg-gray-900 text-white border-gray-900" : "bg-white"}`}
          >
            All Rows
          </button>
          {uniqueRowLetters.map(L => (
            <button
              key={L}
              onClick={() => setRowFilter(L)}
              className={`px-3 py-1 rounded-lg border text-sm ${
                rowFilter === L ? "bg-blue-600 text-white border-blue-600" : "bg-white"
              }`}
            >
              Row {L} <span className="ml-1 text-gray-500">({countsByRow.find(x => x.row === L)?.count || 0})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Shelves Table */}
      <div className="rounded-xl border overflow-hidden bg-white">
        <div className="px-4 py-3 border-b text-sm font-medium text-gray-700">Shelves</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-2">Code</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Row</th>
                <th className="px-4 py-2">Column</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Active</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredShelves.length ? (
                filteredShelves.map(s => {
                  const { rowLetter, col } = parseShelfToRowCol(s, room.code);
                  return (
                    <tr key={s.id} className="border-t">
                      <td className="px-4 py-2 font-mono">{s.code}</td>
                      <td className="px-4 py-2">{s.name}</td>
                      <td className="px-4 py-2">{rowLetter}</td>
                      <td className="px-4 py-2">{col}</td>
                      <td className="px-4 py-2">{s.shelf_type || "—"}</td>
                      <td className="px-4 py-2">{s.is_active ? "Yes" : "No"}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(s.code);
                              toast.success("Code copied");
                            }}
                            className="p-2 rounded-lg border hover:bg-gray-50"
                            title="Copy code"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteShelf(s)}
                            className="p-2 rounded-lg border hover:bg-red-50 text-red-600 border-red-200"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-500" colSpan={7}>
                    No shelves match your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shelf Groups Overview */}
      {shelfGroups.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">Shelf Groups</div>
            <div className="flex gap-2">
              <GlassButton
                onClick={() => setCollapsedGroups(new Set())}
                variant="secondary"
                size="sm"
                className="text-xs"
              >
                Expand All
              </GlassButton>
              <GlassButton
                onClick={() => setCollapsedGroups(new Set(shelfGroups.map(g => g.id)))}
                variant="secondary"
                size="sm"
                className="text-xs"
              >
                Collapse All
              </GlassButton>
            </div>
          </div>
          <div className="grid gap-4">
            {shelfGroups.map(group => (
              <div key={group.id} className="p-4 rounded-xl border bg-white shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => toggleGroupCollapse(group.id)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      {group.collapsed ? (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                    <div className="font-medium">
                      Row {group.startRow}: {group.columns} columns × {group.quantity} quantity
                      <span className="text-xs text-gray-500 ml-2">
                        ({room?.code || 'XX'}{group.startRow}{group.startCol} - {room?.code || 'XX'}{group.endRow}{group.endCol})
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {group.shelves.length} shelves
                  </div>
                </div>
                
                {/* Show summary when collapsed */}
                {group.collapsed && (
                  <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded flex items-center justify-between border-l-4 border-blue-200">
                    <span>Positions: {room?.code || 'XX'}{group.startRow}{group.startCol} to {room?.code || 'XX'}{group.endRow}{group.endCol}</span>
                    <span className="text-blue-500 font-medium">Click to expand</span>
                  </div>
                )}
                
                {/* Show details when expanded */}
                {!group.collapsed && (
                  <div className="space-y-3">
                    {/* Mini Grid Visualization */}
                    {group.rows <= 6 && group.columns <= 8 && (
                      <div className="inline-block border rounded p-2 bg-gray-50">
                        {Array.from({ length: group.rows }, (_, rowIdx) => (
                          <div key={rowIdx} className="flex gap-1 mb-1">
                            {Array.from({ length: group.columns }, (_, colIdx) => {
                              const actualCol = group.startCol + colIdx;
                              const shelf = group.shelves.find(s => {
                                const sRowCol = parseShelfToRowCol(s, room?.code);
                                return sRowCol.col === actualCol;
                              });
                              return (
                                <div
                                  key={colIdx}
                                  className={`w-8 h-6 border text-xs flex items-center justify-center ${
                                    shelf ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white text-gray-400"
                                  }`}
                                >
                                  {room?.code || 'XX'}{group.startRow}{actualCol}
                                  {group.quantity > 1 && (
                                    <span className="text-[10px] text-blue-500">×{group.quantity}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Individual shelf details */}
                    <div className="text-xs text-gray-600">
                      <div className="font-medium mb-2">Shelf Details:</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {group.shelves.map(shelf => (
                          <div key={shelf.id} className="p-2 bg-gray-50 rounded border text-center">
                            <div className="font-mono text-xs">{shelf.code}</div>
                            <div className="text-[10px] text-gray-500">{shelf.name}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visual Grid Preview per Row */}
      {uniqueRowLetters.length > 0 && (
        <div className="space-y-4">
          <div className="text-sm font-medium text-gray-700">Row Preview</div>
          <div className="grid gap-4">
            {uniqueRowLetters.map(L => {
              const maxCols = maxColumnsInRow(L);
              const rowShelves = shelves
                .filter(s => parseShelfToRowCol(s, room.code).rowLetter === L)
                .sort((a, b) => (parseShelfToRowCol(a, room.code).col || 0) - (parseShelfToRowCol(b, room.code).col || 0));
              return (
                <div key={L} className="p-3 rounded-xl border bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">Row {L} ({rowShelves.length} / {maxCols})</div>
                  </div>
                  <div
                    className="grid gap-2"
                    style={{
                      gridTemplateColumns: `repeat(${Math.max(1, maxCols)}, minmax(0, 1fr))`,
                    }}
                  >
                    {Array.from({ length: maxCols }).map((_, idx) => {
                      const shelf = rowShelves.find(s => (parseShelfToRowCol(s, room.code).col || 0) === idx + 1);
                      const code = shelf ? shelf.code : makeShelfCode(room.code, L, idx + 1);
                      return (
                        <div
                          key={idx}
                          className={`h-12 rounded-lg border flex items-center justify-center text-xs font-mono ${
                            shelf ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-gray-50 text-gray-400"
                          }`}
                          title={shelf ? "Existing shelf" : "Empty slot"}
                        >
                          {code}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StorageRoomDetails;
