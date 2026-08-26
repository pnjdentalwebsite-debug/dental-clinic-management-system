import { useMemo, useState } from 'react';
import { CalendarDays, Gift, Wallet } from 'lucide-react';
import type { DashboardAppointmentItem, DashboardBalanceItem, DashboardBirthdayItem } from '../dashboard.mock';
import { DashboardCardPagination } from './DashboardCardPagination';
import { DashboardListCard } from './DashboardListCard';
import { DashboardListItem } from './DashboardListItem';
import { DashboardModal } from './DashboardModal';
import { DashboardModalPagination } from './DashboardModalPagination';

type AppointmentSortMode = 'time-asc' | 'time-desc';
type BirthdaySortMode = 'nearest' | 'latest';
type BalanceSortMode = 'highest' | 'lowest';

interface Props {
  appointments: DashboardAppointmentItem[];
  birthdays: DashboardBirthdayItem[];
  balances: DashboardBalanceItem[];
}

const CARD_ITEMS_PER_PAGE = 5;
const MODAL_ITEMS_PER_PAGE = 10;

const compareAppointmentsByTime = (a: DashboardAppointmentItem, b: DashboardAppointmentItem) => {
  const toMinutes = (value: string) => {
    const [clock, period] = value.split(' ');
    const [hoursText, minutesText] = clock.split(':');
    let hours = Number(hoursText);
    const minutes = Number(minutesText);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  return toMinutes(a.time) - toMinutes(b.time);
};

const compareBirthdays = (a: DashboardBirthdayItem, b: DashboardBirthdayItem) => {
  const toDate = (value: string) => new Date(`2026 ${value}`).getTime();
  return toDate(a.birthday) - toDate(b.birthday);
};

const formatBirthday = (value: string) => {
  const parsed = new Date(`2026 ${value}`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(parsed);
};

const parseAmount = (value: string) => Number(value.replace(/[^0-9.-]/g, '')) || 0;

const appointmentBadgeVariant = (status: DashboardAppointmentItem['status']) => {
  if (status === 'Waiting') return 'waiting';
  if (status === 'Completed') return 'completed';
  if (status === 'Cancelled') return 'no-show';
  return 'confirmed';
};

const getPageSlice = <T,>(items: T[], currentPage: number, itemsPerPage: number) => {
  const start = (currentPage - 1) * itemsPerPage;
  return items.slice(start, start + itemsPerPage);
};

export function DashboardSummarySection({ appointments, birthdays, balances }: Props) {
  const [appointmentSortMode, setAppointmentSortMode] = useState<AppointmentSortMode>('time-asc');
  const [birthdaySortMode, setBirthdaySortMode] = useState<BirthdaySortMode>('nearest');
  const [balanceSortMode, setBalanceSortMode] = useState<BalanceSortMode>('highest');
  const [appointmentPage, setAppointmentPage] = useState(1);
  const [birthdayPage, setBirthdayPage] = useState(1);
  const [balancePage, setBalancePage] = useState(1);
  const [appointmentModalPage, setAppointmentModalPage] = useState(1);
  const [birthdayModalPage, setBirthdayModalPage] = useState(1);
  const [balanceModalPage, setBalanceModalPage] = useState(1);
  const [appointmentsOpen, setAppointmentsOpen] = useState(false);
  const [birthdaysOpen, setBirthdaysOpen] = useState(false);
  const [balancesOpen, setBalancesOpen] = useState(false);

  const sortedAppointments = useMemo(() => {
    const list = [...appointments].sort(compareAppointmentsByTime);
    return appointmentSortMode === 'time-desc' ? list.reverse() : list;
  }, [appointments, appointmentSortMode]);

  const sortedBirthdays = useMemo(() => {
    const list = [...birthdays].sort(compareBirthdays);
    return birthdaySortMode === 'latest' ? list.reverse() : list;
  }, [birthdays, birthdaySortMode]);

  const sortedBalances = useMemo(() => {
    const list = [...balances].sort((a, b) => parseAmount(a.amount) - parseAmount(b.amount));
    return balanceSortMode === 'highest' ? list.reverse() : list;
  }, [balances, balanceSortMode]);

  const appointmentCardItems = getPageSlice(sortedAppointments, appointmentPage, CARD_ITEMS_PER_PAGE);
  const birthdayCardItems = getPageSlice(sortedBirthdays, birthdayPage, CARD_ITEMS_PER_PAGE);
  const balanceCardItems = getPageSlice(sortedBalances, balancePage, CARD_ITEMS_PER_PAGE);

  const appointmentModalTotalPages = Math.max(1, Math.ceil(sortedAppointments.length / MODAL_ITEMS_PER_PAGE));
  const birthdayModalTotalPages = Math.max(1, Math.ceil(sortedBirthdays.length / MODAL_ITEMS_PER_PAGE));
  const balanceModalTotalPages = Math.max(1, Math.ceil(sortedBalances.length / MODAL_ITEMS_PER_PAGE));

  const appointmentModalCurrentPage = Math.min(appointmentModalPage, appointmentModalTotalPages);
  const birthdayModalCurrentPage = Math.min(birthdayModalPage, birthdayModalTotalPages);
  const balanceModalCurrentPage = Math.min(balanceModalPage, balanceModalTotalPages);

  const appointmentModalItems = getPageSlice(sortedAppointments, appointmentModalCurrentPage, MODAL_ITEMS_PER_PAGE);
  const birthdayModalItems = getPageSlice(sortedBirthdays, birthdayModalCurrentPage, MODAL_ITEMS_PER_PAGE);
  const balanceModalItems = getPageSlice(sortedBalances, balanceModalCurrentPage, MODAL_ITEMS_PER_PAGE);

  const todayLabel = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(new Date());

  const handleAppointmentSortChange = (value: AppointmentSortMode) => {
    setAppointmentSortMode(value);
    setAppointmentPage(1);
    setAppointmentModalPage(1);
  };

  const handleBirthdaySortChange = (value: BirthdaySortMode) => {
    setBirthdaySortMode(value);
    setBirthdayPage(1);
    setBirthdayModalPage(1);
  };

  const handleBalanceSortChange = (value: BalanceSortMode) => {
    setBalanceSortMode(value);
    setBalancePage(1);
    setBalanceModalPage(1);
  };

  return (
    <section className="clinic-dashboard-section clinic-dashboard-section--summary" aria-label="Quick summary cards">
      <div className="clinic-dashboard-summary-grid">
        <DashboardListCard
          title="Today's Appointments"
          description="Scheduled visits checklist"
          icon={CalendarDays}
          actionLabel="See All"
          onAction={() => setAppointmentsOpen(true)}
          footerContent={
            sortedAppointments.length === 0 ? (
              <div className="dashboard-list-card__footer dashboard-list-card__footer--empty">
                <span>TOTAL</span>
                <strong>0</strong>
              </div>
            ) : (
              <DashboardCardPagination
                currentPage={appointmentPage}
                totalItems={sortedAppointments.length}
                itemsPerPage={CARD_ITEMS_PER_PAGE}
                onPageChange={setAppointmentPage}
              />
            )
          }
        >
          {sortedAppointments.length === 0 ? (
            <div className="dashboard-summary-card__empty">
              <p>No appointments today.</p>
              <strong>Total: 0</strong>
            </div>
          ) : (
            appointmentCardItems.map((appointment, index) => (
              <DashboardListItem
                key={appointment.id}
                title={appointment.patientName}
                description={appointment.procedure}
                meta={appointment.time}
                badgeLabel={appointment.status}
                badgeVariant={appointmentBadgeVariant(appointment.status)}
                selected={index === 0}
              />
            ))
          )}
        </DashboardListCard>

        <DashboardListCard
          title="Today's Birthdays"
          description="Celebration and greeting registry"
          icon={Gift}
          actionLabel="See All"
          onAction={() => setBirthdaysOpen(true)}
          footerContent={
            sortedBirthdays.length === 0 ? (
              <div className="dashboard-list-card__footer dashboard-list-card__footer--empty">
                <span>TODAY</span>
                <strong>0</strong>
              </div>
            ) : (
              <DashboardCardPagination
                currentPage={birthdayPage}
                totalItems={sortedBirthdays.length}
                itemsPerPage={CARD_ITEMS_PER_PAGE}
                onPageChange={setBirthdayPage}
              />
            )
          }
        >
          {sortedBirthdays.length === 0 ? (
            <div className="dashboard-summary-card__empty">
              <p>No birthdays today.</p>
              <strong>Today: 0</strong>
            </div>
          ) : (
            birthdayCardItems.map((birthday, index) => (
              <DashboardListItem
                key={birthday.id}
                title={birthday.patientName}
                description={formatBirthday(birthday.birthday)}
                badgeLabel={birthday.birthday === todayLabel ? 'TODAY!' : undefined}
                badgeVariant="today"
                selected={index === 0}
              />
            ))
          )}
        </DashboardListCard>

        <DashboardListCard
          title="Patients w/ Balance"
          description="Ledger accounting balances"
          icon={Wallet}
          actionLabel="See All"
          onAction={() => setBalancesOpen(true)}
          footerContent={
            sortedBalances.length === 0 ? (
              <div className="dashboard-list-card__footer dashboard-list-card__footer--empty">
                <span>UNSETTLED</span>
                <strong>0</strong>
              </div>
            ) : (
              <DashboardCardPagination
                currentPage={balancePage}
                totalItems={sortedBalances.length}
                itemsPerPage={CARD_ITEMS_PER_PAGE}
                onPageChange={setBalancePage}
              />
            )
          }
        >
          {sortedBalances.length === 0 ? (
            <div className="dashboard-summary-card__empty">
              <p>No unsettled balances.</p>
              <strong>Unsettled: 0</strong>
            </div>
          ) : (
            balanceCardItems.map((balance, index) => (
              <DashboardListItem
                key={balance.id}
                title={balance.patientName}
                description={`Latest bill: ${balance.lastBillDate}`}
                badgeLabel={balance.amount}
                badgeVariant="balance"
                selected={index === 0}
              />
            ))
          )}
        </DashboardListCard>
      </div>

      <DashboardModal
        open={appointmentsOpen}
        title="Today's Appointments"
        description="Scheduled visits checklist"
        onClose={() => setAppointmentsOpen(false)}
        sortMode={appointmentSortMode}
        onSortModeChange={(value) => handleAppointmentSortChange(value as AppointmentSortMode)}
        sortOptions={[
          { value: 'time-asc', label: 'Earliest Time' },
          { value: 'time-desc', label: 'Latest Time' }
        ]}
        sortLabel="Sort appointments"
        footerContent={
          sortedAppointments.length === 0 ? undefined : (
            <DashboardModalPagination
              currentPage={appointmentModalCurrentPage}
              totalPages={appointmentModalTotalPages}
              totalItems={sortedAppointments.length}
              itemsPerPage={MODAL_ITEMS_PER_PAGE}
              onPageChange={setAppointmentModalPage}
            />
          )
        }
      >
        {sortedAppointments.length === 0 ? (
          <div className="clinic-dashboard-empty-state clinic-dashboard-empty-state--inline">
            <strong>No appointments available.</strong>
          </div>
        ) : (
          appointmentModalItems.map((appointment, index) => (
            <DashboardListItem
              key={appointment.id}
              title={appointment.patientName}
              description={appointment.procedure}
              meta={`${appointment.time} - ${appointment.dentist}`}
              badgeLabel={appointment.status}
              badgeVariant={appointmentBadgeVariant(appointment.status)}
              selected={index === 0}
            />
          ))
        )}
      </DashboardModal>

      <DashboardModal
        open={birthdaysOpen}
        title="Today's Birthdays"
        description="Celebration and greeting registry"
        onClose={() => setBirthdaysOpen(false)}
        sortMode={birthdaySortMode}
        onSortModeChange={(value) => handleBirthdaySortChange(value as BirthdaySortMode)}
        sortOptions={[
          { value: 'nearest', label: 'Nearest Birthday' },
          { value: 'latest', label: 'Latest Birthday' }
        ]}
        sortLabel="Sort birthdays"
        footerContent={
          sortedBirthdays.length === 0 ? undefined : (
            <DashboardModalPagination
              currentPage={birthdayModalCurrentPage}
              totalPages={birthdayModalTotalPages}
              totalItems={sortedBirthdays.length}
              itemsPerPage={MODAL_ITEMS_PER_PAGE}
              onPageChange={setBirthdayModalPage}
            />
          )
        }
      >
        {sortedBirthdays.length === 0 ? (
          <div className="clinic-dashboard-empty-state clinic-dashboard-empty-state--inline">
            <strong>No birthdays available.</strong>
          </div>
        ) : (
          birthdayModalItems.map((birthday, index) => (
            <DashboardListItem
              key={birthday.id}
              title={birthday.patientName}
              description={birthday.contact}
              meta={formatBirthday(birthday.birthday)}
              badgeLabel={birthday.birthday === todayLabel ? 'TODAY!' : undefined}
              badgeVariant="today"
              selected={birthday.birthday === todayLabel || index === 0}
            />
          ))
        )}
      </DashboardModal>

      <DashboardModal
        open={balancesOpen}
        title="Patients w/ Balance"
        description="Ledger accounting balances"
        onClose={() => setBalancesOpen(false)}
        sortMode={balanceSortMode}
        onSortModeChange={(value) => handleBalanceSortChange(value as BalanceSortMode)}
        sortOptions={[
          { value: 'highest', label: 'Highest Balance' },
          { value: 'lowest', label: 'Lowest Balance' }
        ]}
        sortLabel="Sort balances"
        footerContent={
          sortedBalances.length === 0 ? undefined : (
            <DashboardModalPagination
              currentPage={balanceModalCurrentPage}
              totalPages={balanceModalTotalPages}
              totalItems={sortedBalances.length}
              itemsPerPage={MODAL_ITEMS_PER_PAGE}
              onPageChange={setBalanceModalPage}
            />
          )
        }
      >
        {sortedBalances.length === 0 ? (
          <div className="clinic-dashboard-empty-state clinic-dashboard-empty-state--inline">
            <strong>No unsettled balances.</strong>
          </div>
        ) : (
          balanceModalItems.map((balance, index) => (
            <DashboardListItem
              key={balance.id}
              title={balance.patientName}
              description={`Latest bill: ${balance.lastBillDate}`}
              badgeLabel={balance.amount}
              badgeVariant="balance"
              selected={index === 0}
            />
          ))
        )}
      </DashboardModal>
    </section>
  );
}
