import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';

import { SmartPagination } from '../../../dashboard/components/SmartPagination';

import { WaitlistCard, type WaitlistEntry } from './WaitlistCard';

interface Props {
  queue: WaitlistEntry[];
}

const ITEMS_PER_PAGE = 10;

export function WaitlistQueue({ queue }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortMode, setSortMode] = useState<'oldest' | 'name'>('oldest');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredQueue = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = normalizedSearch.length
      ? queue.filter((entry) =>
          [
            entry.patientName,
            entry.patientId,
            entry.procedure,
            entry.scheduledTime,
            entry.arrivalTime,
          ]
            .join(' ')
            .toLowerCase()
            .includes(normalizedSearch),
        )
      : queue;

    return [...filtered].sort((left, right) => {
      if (sortMode === 'name') {
        return left.patientName.localeCompare(right.patientName);
      }

      return getSortableTimeValue(left.scheduledTime) - getSortableTimeValue(right.scheduledTime);
    });
  }, [queue, searchTerm, sortMode]);

  const totalPages = Math.max(1, Math.ceil(filteredQueue.length / ITEMS_PER_PAGE));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortMode]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pagedQueue = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredQueue.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, filteredQueue]);

  const startItem = filteredQueue.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = filteredQueue.length === 0 ? 0 : startItem + pagedQueue.length - 1;

  return (
    <div className="waitlist-queue">
      <div className="waitlist-queue__header">
        <h3>Today's Patient Queue</h3>
        <p>{filteredQueue.length} patient{filteredQueue.length === 1 ? '' : 's'} waiting</p>
      </div>

      <div className="waitlist-queue__toolbar">
        <label className="waitlist-queue__search" aria-label="Search waitlist entries">
          <Search size={16} strokeWidth={2} />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search patient, ID, procedure, or time"
          />
        </label>

        <div className="waitlist-queue__controls">
          <label className="waitlist-queue__sort">
            <span>Sort by</span>
            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as 'oldest' | 'name')}
            >
              <option value="oldest">Old to New</option>
              <option value="name">Patient Name</option>
            </select>
          </label>
        </div>
      </div>

      <div className="waitlist-queue__list">
        {pagedQueue.length > 0 ? (
          pagedQueue.map((entry) => <WaitlistCard key={entry.id} entry={entry} />)
        ) : (
          <div className="waitlist-queue__empty-results">
            <h4>No matching waitlist entries.</h4>
            <p>Try a different patient name, procedure, or sorting option.</p>
          </div>
        )}
      </div>

      <div className="waitlist-queue__footer">
        <p className="waitlist-queue__results">
          Showing {startItem}-{endItem} of {filteredQueue.length} records
        </p>

        {totalPages > 1 ? (
          <SmartPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        ) : null}
      </div>
    </div>
  );
}

function getSortableTimeValue(timeLabel: string) {
  const match = timeLabel.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);

  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }

  let hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();

  if (meridiem === 'PM' && hours !== 12) {
    hours += 12;
  }

  if (meridiem === 'AM' && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}
