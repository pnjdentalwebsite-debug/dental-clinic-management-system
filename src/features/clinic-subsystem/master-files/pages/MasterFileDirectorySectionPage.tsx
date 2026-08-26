import { useEffect, useMemo, useState } from 'react';
import { ConfirmationDialog } from '../../../../components/overlays/ConfirmationDialog';
import {
  masterFileDirectoryService,
  type MasterFileCategoryId,
  type MasterFileTagRecord,
  type ToothStatusRecord
} from '../masterFileDirectoryService';
import { MasterFileRecordModal } from '../components/MasterFileRecordModal';
import { MasterFileTable } from '../components/MasterFileTable';
import { MasterFileToolbar } from '../components/MasterFileToolbar';
import { MasterFileWorkspaceLayout } from '../components/MasterFileWorkspaceLayout';
import { toothItemModuleConfigs, type ToothItemRecord } from '../toothItemConfigs';

interface Props {
  sectionLabel: string;
  title: string;
  description: string;
  categoryId?: MasterFileCategoryId;
  showToast?: (msg: string, type?: 'success' | 'info') => void;
}

const createDefaultStatusRecord = (): ToothStatusRecord => ({
  id: '',
  code: '',
  name: '',
  description: '',
  color: '#4f7bf5',
  active: true,
  sortOrder: 0,
  behavior: 'surface',
  instructions: '',
  clinicalCode: '',
  clinicalCodeOverride: '',
  legacyCode: '',
  chartMeaning: '',
  updatedAt: '2026-07-29'
});

const createDefaultTagRecord = (categoryId: Exclude<MasterFileCategoryId, 'tooth-status'>): MasterFileTagRecord => ({
  id: '',
  categoryId,
  code: '',
  name: '',
  description: '',
  active: true,
  sortOrder: 0,
  instructions: '',
  color: '',
  clinicalMeaning: '',
  severity: '',
  category: '',
  procedureCategory: '',
  xrayType: '',
  legacyCode: '',
  chartMeaning: '',
  updatedAt: '2026-07-29'
});

export function MasterFileDirectorySectionPage({
  sectionLabel: _sectionLabel,
  title,
  description,
  categoryId,
  showToast
}: Props) {
  const ITEMS_PER_PAGE = 7;
  const [version, setVersion] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [sortBy, setSortBy] = useState('sortOrder');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedRecord, setSelectedRecord] = useState<ToothItemRecord | null>(null);
  const [recordPendingDelete, setRecordPendingDelete] = useState<ToothItemRecord | null>(null);

  const records = useMemo(() => {
    if (!categoryId) return [];
    const refreshVersion = version;
    const baseRecords = categoryId === 'tooth-status'
      ? masterFileDirectoryService.getToothStatuses()
      : masterFileDirectoryService.getTagRecords(categoryId);

    return baseRecords
      .filter((record) => {
        const haystack = [record.name, record.code, record.description].join(' ').toLowerCase();
        const matchesSearch = haystack.includes(search.trim().toLowerCase());
        const matchesStatus = statusFilter === 'all'
          ? true
          : statusFilter === 'active'
            ? record.active
            : !record.active;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'code') return a.code.localeCompare(b.code);
        if (sortBy === 'updatedAt') return b.updatedAt.localeCompare(a.updatedAt);
        return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name) || refreshVersion;
      });
  }, [categoryId, search, sortBy, statusFilter, version]);

  const refresh = (message?: string) => {
    setVersion((current) => current + 1);
    if (message && showToast) {
      showToast(message, 'success');
    }
  };

  const isManagedCategory = Boolean(categoryId && toothItemModuleConfigs[categoryId]);
  const config = categoryId ? toothItemModuleConfigs[categoryId] : undefined;
  const totalPages = Math.max(1, Math.ceil(records.length / ITEMS_PER_PAGE));
  const normalizedPage = Math.min(currentPage, totalPages);
  const paginatedRecords = records.slice((normalizedPage - 1) * ITEMS_PER_PAGE, normalizedPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortBy, statusFilter, categoryId]);

  const getEmptyRecord = (): ToothItemRecord => {
    if (categoryId === 'tooth-status') return createDefaultStatusRecord();
    if (categoryId) return createDefaultTagRecord(categoryId);
    return createDefaultStatusRecord();
  };

  return (
    <MasterFileWorkspaceLayout
        title={title}
        description={description}
      >

      {isManagedCategory ? (
        <>
          <MasterFileToolbar
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            searchPlaceholder={config?.searchPlaceholder}
            sortOptions={config?.sortOptions}
            addLabel={config!.addLabel}
            onAdd={() => {
              setModalMode('add');
              setSelectedRecord(getEmptyRecord());
              setModalOpen(true);
            }}
          />

          <MasterFileTable
            config={config!}
            records={paginatedRecords}
            currentPage={normalizedPage}
            totalPages={totalPages}
            totalItems={records.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            onEdit={(record) => {
              setModalMode('edit');
              setSelectedRecord(record);
              setModalOpen(true);
            }}
            onDelete={(record) => {
              setRecordPendingDelete(record);
            }}
            onDuplicate={(record) => {
              const duplicate = {
                ...record,
                id: '',
                code: record.code ? `${record.code}-COPY` : '',
                name: `${record.name} Copy`
              };
              setModalMode('add');
              setSelectedRecord(duplicate);
              setModalOpen(true);
              showToast?.(`${record.name} duplicated into a new draft.`, 'info');
            }}
            onAdd={() => {
              setModalMode('add');
              setSelectedRecord(getEmptyRecord());
              setModalOpen(true);
            }}
          />

          {selectedRecord && (
            <MasterFileRecordModal
              open={modalOpen}
              mode={modalMode}
              config={config!}
              initialRecord={selectedRecord}
              onClose={() => setModalOpen(false)}
              onSave={(record) => {
                if (categoryId === 'tooth-status') {
                  masterFileDirectoryService.saveToothStatus(record as ToothStatusRecord);
                  refresh(modalMode === 'edit' ? 'Tooth status updated.' : 'Tooth status saved.');
                } else if (categoryId) {
                  masterFileDirectoryService.saveTagRecord(record as MasterFileTagRecord);
                  refresh(modalMode === 'edit' ? `${title} updated.` : `${title} saved.`);
                }
                setModalOpen(false);
              }}
            />
          )}

          <ConfirmationDialog
            open={Boolean(recordPendingDelete)}
            title={`Delete ${config!.title} record?`}
            description={recordPendingDelete
              ? `Do you want to delete "${recordPendingDelete.name}"? This will remove it from the local Master File Directory list.`
              : 'Do you want to delete this record?'}
            confirmLabel="Delete Record"
            cancelLabel="Keep Record"
            destructive
            onCancel={() => setRecordPendingDelete(null)}
            onConfirm={() => {
              if (!recordPendingDelete) return;

              if (categoryId === 'tooth-status') {
                masterFileDirectoryService.deleteToothStatus(recordPendingDelete.id);
                refresh('Tooth status deleted.');
              } else if (categoryId) {
                masterFileDirectoryService.deleteTagRecord(recordPendingDelete.id);
                refresh(`${title} item deleted.`);
              }

              setRecordPendingDelete(null);
            }}
          />
        </>
      ) : (
        <section className="patient-record__card master-file-workspace__placeholder">
          <h3>{title} workspace shell</h3>
          <p>
            This route is now part of the dedicated Master File Directory workspace. The management forms and data controls will be connected in the next implementation phase.
          </p>
        </section>
      )}
    </MasterFileWorkspaceLayout>
  );
}
