import React from 'react';
import { Customer } from '../types';

interface BulkFiltersPanelProps {
  customers: Customer[];
  filterTag: string;
  setFilterTag: (v: string) => void;
  filterTagsMulti: string[];
  setFilterTagsMulti: (v: string[]) => void;
  filterLoyalty: string;
  setFilterLoyalty: (v: string) => void;
  filterLoyaltyMulti: string[];
  setFilterLoyaltyMulti: (v: string[]) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  filterRegDateFrom: string;
  setFilterRegDateFrom: (v: string) => void;
  filterRegDateTo: string;
  setFilterRegDateTo: (v: string) => void;
  filterCity: string;
  setFilterCity: (v: string) => void;
  filterGender: string;
  setFilterGender: (v: string) => void;
  filterLastVisitFrom: string;
  setFilterLastVisitFrom: (v: string) => void;
  filterLastVisitTo: string;
  setFilterLastVisitTo: (v: string) => void;
  filterTotalSpentMin: string;
  setFilterTotalSpentMin: (v: string) => void;
  filterTotalSpentMax: string;
  setFilterTotalSpentMax: (v: string) => void;
  excludeTag: string;
  setExcludeTag: (v: string) => void;
  excludeTagsMulti: string[];
  setExcludeTagsMulti: (v: string[]) => void;
  excludeStatus: string;
  setExcludeStatus: (v: string) => void;
}

const BulkFiltersPanel: React.FC<BulkFiltersPanelProps> = (props) => {
  const {
    customers,
    filterTag, setFilterTag,
    filterTagsMulti, setFilterTagsMulti,
    filterLoyalty, setFilterLoyalty,
    filterLoyaltyMulti, setFilterLoyaltyMulti,
    filterStatus, setFilterStatus,
    filterRegDateFrom, setFilterRegDateFrom,
    filterRegDateTo, setFilterRegDateTo,
    filterCity, setFilterCity,
    filterGender, setFilterGender,
    filterLastVisitFrom, setFilterLastVisitFrom,
    filterLastVisitTo, setFilterLastVisitTo,
    filterTotalSpentMin, setFilterTotalSpentMin,
    filterTotalSpentMax, setFilterTotalSpentMax,
    excludeTag, setExcludeTag,
    excludeTagsMulti, setExcludeTagsMulti,
    excludeStatus, setExcludeStatus
  } = props;

  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {/* Tag (single) */}
      <input
        type="text"
        placeholder="Filter by tag"
        value={filterTag}
        onChange={e => setFilterTag(e.target.value)}
        className="border border-gray-200 rounded px-2 py-1 text-xs bg-gray-50"
      />
      {/* Tag (multi) */}
      <select
        multiple
        value={filterTagsMulti}
        onChange={e => setFilterTagsMulti(Array.from(e.target.selectedOptions, o => o.value))}
        className="border border-gray-200 rounded px-2 py-1 text-xs bg-gray-50 min-w-[100px]"
      >
        {[...new Set(customers.flatMap(c => c.tags || []))].filter(Boolean).map(tag => (
          <option key={tag} value={tag}>{tag}</option>
        ))}
      </select>
      {/* Loyalty (single) */}
      <select
        value={filterLoyalty}
        onChange={e => setFilterLoyalty(e.target.value)}
        className="border border-gray-200 rounded px-2 py-1 text-xs bg-gray-50"
      >
        <option value="">All Loyalty</option>
        <option value="platinum">Platinum</option>
        <option value="gold">Gold</option>
        <option value="silver">Silver</option>
        <option value="bronze">Bronze</option>
      </select>
      {/* Loyalty (multi) */}
      <select
        multiple
        value={filterLoyaltyMulti}
        onChange={e => setFilterLoyaltyMulti(Array.from(e.target.selectedOptions, o => o.value))}
        className="border border-gray-200 rounded px-2 py-1 text-xs bg-gray-50 min-w-[100px]"
      >
        {['platinum','gold','silver','bronze'].map(lvl => (
          <option key={lvl} value={lvl}>{lvl.charAt(0).toUpperCase() + lvl.slice(1)}</option>
        ))}
      </select>
      {/* Status */}
      <select
        value={filterStatus}
        onChange={e => setFilterStatus(e.target.value)}
        className="border border-gray-200 rounded px-2 py-1 text-xs bg-gray-50"
      >
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
      {/* Registration date */}
      <input
        type="date"
        value={filterRegDateFrom}
        onChange={e => setFilterRegDateFrom(e.target.value)}
        className="border border-gray-200 rounded px-2 py-1 text-xs bg-gray-50"
        placeholder="From"
      />
      <input
        type="date"
        value={filterRegDateTo}
        onChange={e => setFilterRegDateTo(e.target.value)}
        className="border border-gray-200 rounded px-2 py-1 text-xs bg-gray-50"
        placeholder="To"
      />
      {/* City */}
      <select
        value={filterCity}
        onChange={e => setFilterCity(e.target.value)}
        className="border border-gray-200 rounded px-2 py-1 text-xs bg-gray-50 min-w-[100px]"
      >
        <option value="">All Cities</option>
        {[...new Set(customers.map(c => c.city).filter(Boolean))].map(city => (
          <option key={city} value={city}>{city}</option>
        ))}
      </select>
      {/* Gender */}
      <select
        value={filterGender}
        onChange={e => setFilterGender(e.target.value)}
        className="border border-gray-200 rounded px-2 py-1 text-xs bg-gray-50 min-w-[80px]"
      >
        <option value="">All Genders</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </select>
      {/* Last Visit */}
      <input
        type="date"
        value={filterLastVisitFrom}
        onChange={e => setFilterLastVisitFrom(e.target.value)}
        className="border border-gray-200 rounded px-2 py-1 text-xs bg-gray-50"
        placeholder="Last Visit From"
      />
      <input
        type="date"
        value={filterLastVisitTo}
        onChange={e => setFilterLastVisitTo(e.target.value)}
        className="border border-gray-200 rounded px-2 py-1 text-xs bg-gray-50"
        placeholder="Last Visit To"
      />
      {/* Total Spent */}
      <input
        type="number"
        value={filterTotalSpentMin}
        onChange={e => setFilterTotalSpentMin(e.target.value)}
        className="border border-gray-200 rounded px-2 py-1 text-xs bg-gray-50 w-20"
        placeholder="Spent Min"
      />
      <input
        type="number"
        value={filterTotalSpentMax}
        onChange={e => setFilterTotalSpentMax(e.target.value)}
        className="border border-gray-200 rounded px-2 py-1 text-xs bg-gray-50 w-20"
        placeholder="Spent Max"
      />
      {/* Exclude Tag (single) */}
      <input
        type="text"
        placeholder="Exclude tag"
        value={excludeTag}
        onChange={e => setExcludeTag(e.target.value)}
        className="border border-gray-200 rounded px-2 py-1 text-xs bg-gray-50"
      />
      {/* Exclude Tag (multi) */}
      <select
        multiple
        value={excludeTagsMulti}
        onChange={e => setExcludeTagsMulti(Array.from(e.target.selectedOptions, o => o.value))}
        className="border border-gray-200 rounded px-2 py-1 text-xs bg-gray-50 min-w-[100px]"
      >
        {[...new Set(customers.flatMap(c => c.tags || []))].filter(Boolean).map(tag => (
          <option key={tag} value={tag}>{tag}</option>
        ))}
      </select>
      {/* Exclude Status */}
      <select
        value={excludeStatus}
        onChange={e => setExcludeStatus(e.target.value)}
        className="border border-gray-200 rounded px-2 py-1 text-xs bg-gray-50"
      >
        <option value="">Exclude Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>
  );
};

export default BulkFiltersPanel; 