import React, { useState, useEffect } from 'react';
import { X, Building, Grid3X3 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { storeLocationApi } from '../../../../features/settings/utils/storeLocationApi';
import { storageRoomApi, StorageRoom as StorageRoomType } from '../../../../features/settings/utils/storageRoomApi';
import { storeShelfApi } from '../../../../features/settings/utils/storeShelfApi';
import GlassButton from '../../../../features/shared/components/ui/GlassButton';
import { supabase } from '../../../../lib/supabaseClient';

type StorageRoom = StorageRoomType;

interface StorageRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  storageRoom?: StorageRoom | null;
  onSave: (storageRoom: any) => void;
}

/** Helpers */
const ROWS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const letterToIndex = (letter: string) =>
  Math.max(1, ROWS.indexOf((letter || 'A').toUpperCase()) + 1);
const indexToLetter = (idx: number) =>
  ROWS[(idx - 1) % 26] || String(idx);
const makeShelfCode = (
  roomCode: string,
  rowLetter: string,
  columnNumber: number
) => `${roomCode}${rowLetter.toUpperCase()}${columnNumber}`;

const StorageRoomModal: React.FC<StorageRoomModalProps> = ({
  isOpen,
  onClose,
  storageRoom,
  onSave
}) => {
  const [storeLocations, setStoreLocations] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Simplified form data (only essentials)
  const [formData, setFormData] = useState({
    store_location_id: '',
    name: '',
    code: '', // e.g. "01"
    floor_level: 1,
    // rowConfig allows users to specify row letter and number of columns
    rowConfig: [] as { row_letter: string; columns: number }[],
    // manualShelves stores shelves created manually or generated from rowConfig
    manualShelves: [] as {
      code: string;
      row_letter: string;
      column_number: number;
    }[],
    // control whether add shelf form is visible
    showShelfForm: false,
    // newShelf collects row letter and column number for a new shelf
    newShelf: {
      code: '',
      row_letter: 'A',
      column_number: 1
    }
  });

  /** Load store locations when modal opens */
  useEffect(() => {
    if (isOpen) {
      loadStoreLocations();
    }
  }, [isOpen]);

  /** Reset form data when modal opens or storageRoom changes */
  useEffect(() => {
    if (storageRoom) {
      setFormData(prev => ({
        ...prev,
        store_location_id: storageRoom.store_location_id || '',
        name: storageRoom.name || '',
        code: storageRoom.code || '',
        floor_level: storageRoom.floor_level || 1,
        rowConfig: [],
        manualShelves: [],
        showShelfForm: false,
        newShelf: {
          code: storageRoom.code ? makeShelfCode(storageRoom.code, 'A', 1) : '',
          row_letter: 'A',
          column_number: 1
        }
      }));
    } else {
      setFormData({
        store_location_id: '',
        name: '',
        code: '',
        floor_level: 1,
        rowConfig: [],
        manualShelves: [],
        showShelfForm: false,
        newShelf: {
          code: '',
          row_letter: 'A',
          column_number: 1
        }
      });
    }
    setErrors({});
  }, [storageRoom, isOpen]);

  /** Load available store locations */
  const loadStoreLocations = async () => {
    try {
      const locations = await storeLocationApi.getAll();
      setStoreLocations(locations);
      if (locations.length > 0 && !formData.store_location_id) {
        setFormData(prev => ({ ...prev, store_location_id: locations[0].id }));
      }
    } catch (err) {
      console.error('Error loading store locations:', err);
    }
  };

  /** Validate essential fields */
  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!formData.store_location_id) {
      e.store_location_id = 'Store location is required';
    }
    if (!formData.name.trim()) {
      e.name = 'Room name is required';
    }
    if (!formData.code.trim()) {
      e.code = 'Room code/number is required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /** Check if room code is available for a new room */
  const checkCodeAvailability = async (
    code: string,
    storeLocationId: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('lats_storage_rooms')
        .select('id')
        .eq('code', code)
        .eq('store_location_id', storeLocationId)
        .single();
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      return !data;
    } catch (err) {
      console.error('Error checking code availability:', err);
      return false;
    }
  };

  /** Generic input handler */
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Row configuration handlers
  const handleAddRow = () => {
    // find next unused row letter
    const used = new Set(
      formData.rowConfig.map(r => r.row_letter.toUpperCase())
    );
    let nextLetter = '';
    for (const L of ROWS) {
      if (!used.has(L)) {
        nextLetter = L;
        break;
      }
    }
    if (!nextLetter) {
      nextLetter = indexToLetter(formData.rowConfig.length + 1);
    }
    setFormData(prev => ({
      ...prev,
      rowConfig: [...prev.rowConfig, { row_letter: nextLetter, columns: 1 }]
    }));
  };

  const handleRemoveRow = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      rowConfig: prev.rowConfig.filter((_, i) => i !== idx)
    }));
  };

  const handleUpdateRowLetter = (idx: number, letter: string) => {
    const L = (letter || 'A').toUpperCase().slice(0, 1);
    setFormData(prev => ({
      ...prev,
      rowConfig: prev.rowConfig.map((r, i) =>
        i === idx ? { ...r, row_letter: L } : r
      )
    }));
  };

  const handleUpdateRowColumns = (idx: number, cols: number) => {
    const c = Math.max(1, Math.min(100, Number(cols) || 1));
    setFormData(prev => ({
      ...prev,
      rowConfig: prev.rowConfig.map((r, i) =>
        i === idx ? { ...r, columns: c } : r
      )
    }));
  };

  /** Generate shelves based on row configuration */
  const handleGenerateShelvesFromRows = () => {
    const { rowConfig, code } = formData;
    if (!rowConfig.length) {
      return toast.error('Ongeza angalau row moja kwanza');
    }
    if (!code.trim()) {
      return toast.error(
        'Weka Room Code/Number kwanza (mf. 01)'
      );
    }
    const generated: typeof formData.manualShelves = [];
    rowConfig.forEach(r => {
      for (let c = 1; c <= r.columns; c++) {
        generated.push({
          code: makeShelfCode(code, r.row_letter, c),
          row_letter: r.row_letter,
          column_number: c
        });
      }
    });
    // unique filter
    const existingCodes = new Set(formData.manualShelves.map(s => s.code));
    const unique = generated.filter(g => !existingCodes.has(g.code));
    setFormData(prev => ({
      ...prev,
      manualShelves: [...prev.manualShelves, ...unique]
    }));
    toast.success(`Generated ${unique.length} shelves`);
  };

  // Manual shelf handlers
  const handleAddShelf = () => {
    // initialize new shelf
    const initRow = 'A';
    const initCol = 1;
    const initCode = formData.code
      ? makeShelfCode(formData.code, initRow, initCol)
      : '';
    setFormData(prev => ({
      ...prev,
      showShelfForm: true,
      newShelf: {
        row_letter: initRow,
        column_number: initCol,
        code: initCode
      }
    }));
  };

  const handleShelfInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const ns = { ...prev.newShelf, [field]: value };
      // update code when row_letter or column_number changes
      if (
        (field === 'row_letter' || field === 'column_number') &&
        prev.code
      ) {
        const rowL =
          field === 'row_letter' ? value : ns.row_letter || 'A';
        const colN =
          field === 'column_number'
            ? Number(value)
            : ns.column_number || 1;
        ns.code = makeShelfCode(prev.code, rowL, colN);
      }
      return { ...prev, newShelf: ns };
    });
  };

  /** Save a manually defined shelf */
  const handleSaveShelf = () => {
    const s = formData.newShelf;
    if (!s.row_letter) {
      return toast.error('Weka Row Letter (mf. A)');
    }
    if (!s.column_number || s.column_number < 1) {
      return toast.error('Weka Column Number ≥ 1');
    }
    if (!formData.code.trim()) {
      return toast.error('Weka Room Code/Number kwanza');
    }
    const code = makeShelfCode(
      formData.code,
      s.row_letter,
      s.column_number
    );
    if (formData.manualShelves.some(x => x.code === code)) {
      return toast.error(
        'Hii shelf (code) tayari ipo kwenye orodha yako'
      );
    }
    setFormData(prev => ({
      ...prev,
      manualShelves: [
        ...prev.manualShelves,
        {
          code,
          row_letter: s.row_letter,
          column_number: s.column_number
        }
      ],
      showShelfForm: false,
      newShelf: {
        code: prev.code
          ? makeShelfCode(prev.code, 'A', 1)
          : '',
        row_letter: 'A',
        column_number: 1
      }
    }));
    toast.success('Shelf imeongezwa');
  };

  const handleRemoveShelf = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      manualShelves: prev.manualShelves.filter(
        (_, i) => i !== idx
      )
    }));
  };

  /** Submit handler to create or update room and its shelves */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    // check code availability if new room
    if (!storageRoom) {
      const ok = await checkCodeAvailability(
        formData.code,
        formData.store_location_id
      );
      if (!ok) {
        setErrors(prev => ({
          ...prev,
          code: 'Room code already exists in this location'
        }));
        return;
      }
    }
    setIsSubmitting(true);
    try {
      const roomPayload = {
        store_location_id: formData.store_location_id,
        name: formData.name,
        code: formData.code,
        floor_level: formData.floor_level
      };
      let roomId: string | undefined;
      if (storageRoom) {
        await storageRoomApi.update({
          id: storageRoom.id,
          ...roomPayload
        });
        toast.success('Storage room updated');
      } else {
        const created = await storageRoomApi.create(roomPayload);
        roomId = created?.id;
        toast.success('Storage room created');
        // prepare shelves to create
        let toCreate = [...formData.manualShelves];
        // if manual shelves empty but rows defined, generate fallback
        if (!toCreate.length && formData.rowConfig.length) {
          const fallback: typeof formData.manualShelves = [];
          formData.rowConfig.forEach(r => {
            for (let c = 1; c <= r.columns; c++) {
              fallback.push({
                code: makeShelfCode(formData.code, r.row_letter, c),
                row_letter: r.row_letter,
                column_number: c
              });
            }
          });
          toCreate = fallback;
        }
        // insert shelves
        if (roomId && toCreate.length) {
          const tasks = toCreate.map(s => {
            // generate name from row/column
            const shelfName = `Shelf ${s.row_letter}${s.column_number}`;
            const payload = {
              store_location_id: formData.store_location_id,
              storage_room_id: roomId!,
              name: shelfName,
              code: s.code,
              shelf_type: 'standard',
              row_number: letterToIndex(s.row_letter),
              column_number: s.column_number,
              floor_level: formData.floor_level,
              is_active: true,
              is_accessible: true,
              requires_ladder: false,
              is_refrigerated: false,
              priority_order:
                (letterToIndex(s.row_letter) - 1) * 100 +
                s.column_number
            };
            return storeShelfApi.create(payload);
          });
          try {
            await Promise.all(tasks);
            toast.success(`Created ${toCreate.length} shelves`);
          } catch (err) {
            console.error('Shelf creation errors', err);
            toast.error(
              'Room created, lakini shelves zingine zimeshindwa kuundwa'
            );
          }
        }
      }
      onSave(roomPayload);
      onClose();
    } catch (err: any) {
      console.error('Save error', err);
      if (
        err?.code === '23505' ||
        err?.message?.includes('duplicate')
      ) {
        toast.error('Room code tayari imetumika');
        setErrors(prev => ({
          ...prev,
          code: 'This code is already in use'
        }));
      } else {
        toast.error('Failed to save');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // do not render if modal not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden bg-white rounded-lg shadow-xl border">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                {storageRoom ? 'Edit Storage Room' : 'Add New Storage Room'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Body */}
          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto p-4 space-y-6"
          >
            {/* Essentials */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Room Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.name
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="e.g., Shop 01 Main Room"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>
              {/* Room Code / Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Code / Number *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={e => handleInputChange('code', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.code
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="e.g., 01"
                />
                {errors.code && (
                  <p className="text-red-500 text-xs mt-1">{errors.code}</p>
                )}
              </div>
              {/* Store Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Store Location *
                </label>
                <select
                  value={formData.store_location_id}
                  onChange={e =>
                    handleInputChange(
                      'store_location_id',
                      e.target.value
                    )
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.store_location_id
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a store location</option>
                  {storeLocations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
                {errors.store_location_id && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.store_location_id}
                  </p>
                )}
              </div>
              {/* Floor level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Floor Level
                </label>
                <input
                  type="number"
                  min={1}
                  value={formData.floor_level}
                  onChange={e =>
                    handleInputChange(
                      'floor_level',
                      parseInt(e.target.value) || 1
                    )
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 border-gray-300"
                />
              </div>
            </div>
            {/* Shelf Layout (only for new rooms) */}
            {!storageRoom && (
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Grid3X3 className="w-5 h-5 text-blue-500" />
                  <h4 className="text-sm font-semibold text-gray-800">
                    Shelf Layout Configuration
                  </h4>
                </div>

                {/* Row Config */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-medium text-gray-700">
                      Row Configuration (set columns per row)
                    </h5>
                    <button
                      type="button"
                      onClick={handleAddRow}
                      className="px-3 py-1 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      + Add Row
                    </button>
                  </div>
                  {formData.rowConfig.length ? (
                    <div className="space-y-2 max-h-44 overflow-y-auto">
                      {formData.rowConfig.map((row, i) => (
                        <div
                          key={i}
                          className="p-3 bg-gray-50 rounded-lg border"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              Row {row.row_letter}:{' '}
                              {row.columns} columns
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(i)}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-600">
                                Row Letter
                              </span>
                              <input
                                type="text"
                                value={row.row_letter}
                                onChange={e =>
                                  handleUpdateRowLetter(
                                    i,
                                    e.target.value
                                  )
                                }
                                maxLength={1}
                                className="w-16 px-2 py-1 text-sm border rounded"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-600">
                                Columns
                              </span>
                              <input
                                type="number"
                                min={1}
                                max={100}
                                value={row.columns}
                                onChange={e =>
                                  handleUpdateRowColumns(
                                    i,
                                    Number(e.target.value)
                                  )
                                }
                                className="w-24 px-2 py-1 text-sm border rounded"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg border text-center text-sm text-gray-500">
                      Hakuna rows bado. Bonyeza "Add Row".
                    </div>
                  )}
                  {formData.rowConfig.length > 0 && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={handleGenerateShelvesFromRows}
                        className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm font-medium"
                      >
                        Generate Shelves from Row Configuration
                      </button>
                    </div>
                  )}
                </div>

                {/* Manual shelves */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-medium text-gray-700">
                      Manual Shelves (fine-grained)
                    </h5>
                    <button
                      type="button"
                      onClick={handleAddShelf}
                      className="px-3 py-1 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      + Add Shelf
                    </button>
                  </div>

                  {formData.manualShelves.length ? (
                    <div className="space-y-2 max-h-44 overflow-y-auto">
                      {formData.manualShelves.map((s, i) => (
                        <div
                          key={i}
                          className="p-3 bg-gray-50 rounded-lg border"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">
                              {s.code}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveShelf(i)}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                            <div>Row: {s.row_letter}</div>
                            <div>Column: {s.column_number}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg border text-center text-sm text-gray-500">
                      Hakuna shelves bado. Bonyeza "Add Shelf".
                    </div>
                  )}

                  {formData.showShelfForm && (
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <h6 className="text-sm font-medium text-gray-700 mb-3">
                        Add New Shelf
                      </h6>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Row Letter
                          </label>
                          <input
                            type="text"
                            maxLength={1}
                            value={formData.newShelf.row_letter}
                            onChange={e =>
                              handleShelfInputChange(
                                'row_letter',
                                e.target.value.toUpperCase()
                              )
                            }
                            className="w-full px-2 py-1 text-sm border rounded"
                            placeholder="A"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Column Number
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={formData.newShelf.column_number}
                            onChange={e =>
                              handleShelfInputChange(
                                'column_number',
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-full px-2 py-1 text-sm border rounded"
                            placeholder="1"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Shelf Code (auto)
                          </label>
                          <input
                            type="text"
                            value={formData.newShelf.code}
                            onChange={e =>
                              handleShelfInputChange(
                                'code',
                                e.target.value
                              )
                            }
                            className="w-full px-2 py-1 text-sm border rounded bg-gray-50"
                            placeholder="e.g., 01A1"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Format: 
                            {formData.code || 'ROOM'}
                            {formData.newShelf.row_letter || 'A'}
                            {formData.newShelf.column_number || 1}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          type="button"
                          onClick={handleSaveShelf}
                          className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Save Shelf
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleInputChange('showShelfForm', false)
                          }
                          className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex gap-3 justify-end pt-2 border-t">
              <GlassButton
                type="button"
                onClick={onClose}
                variant="secondary"
                disabled={isSubmitting}
              >
                Cancel
              </GlassButton>
              <GlassButton
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white"
              >
                {isSubmitting
                  ? 'Saving...'
                  : storageRoom
                  ? 'Update Storage Room'
                  : 'Create Storage Room'}
              </GlassButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StorageRoomModal;