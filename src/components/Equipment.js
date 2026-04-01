import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

function Equipment({ items, loading, onAddEquipment, showToast, onRequestEquipment }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState('search'); // search | bookings

  const [district, setDistrict] = useState('');
  const [mandal, setMandal] = useState('');
  const [village, setVillage] = useState('');
  const [withinKm, setWithinKm] = useState('');
  const [equipmentType, setEquipmentType] = useState('');
  const [operation, setOperation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [modeFilter, setModeFilter] = useState('all');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestItem, setRequestItem] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const lastBookingPhoneRef = useRef('');

  const BOOKINGS_KEY = useMemo(() => {
    const uid = user?.id != null ? String(user.id) : 'anon';
    return `agrovibes_equipment_bookings_${uid}`;
  }, [user]);

  function readLocalBookings() {
    try {
      const raw = window.localStorage.getItem(BOOKINGS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeLocalBookings(list) {
    try {
      window.localStorage.setItem(BOOKINGS_KEY, JSON.stringify(Array.isArray(list) ? list : []));
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    setBookings(readLocalBookings());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [BOOKINGS_KEY]);

  const handleSubmitEquipment = (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.itemName.value.trim();
    const modeKey = form.mode.value;
    const price = form.price.value.trim();
    const location = form.location.value.trim();
    const includesOperator = form.includesOperator.checked;
    const isNegotiable = form.isNegotiable.checked;
    if (!name || !price) return;
    onAddEquipment({
      name,
      mode: modeKey,
      modeKey,
      price,
      location,
      includesOperator,
      isNegotiable,
    });
    form.reset();
    setShowAddForm(false);
  };

  const normalizedItems = useMemo(() => (Array.isArray(items) ? items : []), [items]);
  const hasItems = normalizedItems.length > 0;

  const parsedLocations = useMemo(() => {
    // We don't have structured district/mandal/village in backend, so we parse simple "A, B, C".
    // village = first, mandal = second, district = last.
    return normalizedItems.map((it) => {
      const parts = (it.location || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const parsed = {
        village: parts[0] || '',
        mandal: parts.length >= 2 ? parts[1] : '',
        district: parts.length >= 3 ? parts[parts.length - 1] : parts[1] || '',
      };
      return { id: it.id, ...parsed };
    });
  }, [normalizedItems]);

  const districtOptions = useMemo(() => {
    const set = new Set();
    parsedLocations.forEach((p) => p.district && set.add(p.district));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [parsedLocations]);

  const mandalOptions = useMemo(() => {
    const set = new Set();
    parsedLocations.forEach((p) => {
      if (district && p.district !== district) return;
      if (p.mandal) set.add(p.mandal);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [parsedLocations, district]);

  const villageOptions = useMemo(() => {
    const set = new Set();
    parsedLocations.forEach((p) => {
      if (district && p.district !== district) return;
      if (mandal && p.mandal !== mandal) return;
      if (p.village) set.add(p.village);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [parsedLocations, district, mandal]);

  const equipmentTypeOptions = useMemo(() => {
    const set = new Set();
    normalizedItems.forEach((it) => {
      if (it.name) set.add(it.name);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [normalizedItems]);

  const operationOptions = useMemo(
    () => [
      'Ploughing',
      'Sowing',
      'Spraying',
      'Harvesting',
      'Transportation',
      'Inter cultivation',
      'Puddling',
    ],
    [],
  );

  const filteredItems = normalizedItems.filter((item) => {
    const modeValue = (item.modeKey || item.mode || '').toString().toLowerCase();
    const matchesMode = modeFilter === 'all' ? true : modeValue === modeFilter;

    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      (item.name && item.name.toLowerCase().includes(term)) ||
      (item.location && item.location.toLowerCase().includes(term));

    const loc = parsedLocations.find((p) => p.id === item.id) || { district: '', mandal: '', village: '' };
    const matchesDistrict = !district || loc.district === district;
    const matchesMandal = !mandal || loc.mandal === mandal;
    const matchesVillage = !village || loc.village === village;

    const matchesEquipmentType = !equipmentType || (item.name || '') === equipmentType;

    // withinKm/operation/startDate/endDate are not currently represented in backend data,
    // so we treat them as UI-only filters (they affect booking requests, not search results).
    return (
      matchesMode &&
      matchesSearch &&
      matchesDistrict &&
      matchesMandal &&
      matchesVillage &&
      matchesEquipmentType
    );
  });

  const decoratedResults = useMemo(() => {
    // Provide “best results” ordering: prefer closer-looking items if withinKm chosen (heuristic),
    // otherwise sort by name. Since we don't have geo, distance is a stable pseudo-value.
    const seed = (s) => {
      let h = 2166136261;
      for (let i = 0; i < s.length; i += 1) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return Math.abs(h);
    };
    const withDistance = filteredItems.map((it) => {
      const key = `${it.id || ''}|${it.name || ''}|${it.location || ''}`;
      const h = seed(key);
      const km = 1 + (h % 25); // 1..25km
      const rating = 3 + ((h % 20) / 10); // 3.0..4.9
      return { ...it, _distanceKm: km, _rating: Math.round(rating * 10) / 10 };
    });

    const maxKm = withinKm ? Number(withinKm) : null;
    const filteredByWithin =
      Number.isFinite(maxKm) && maxKm > 0 ? withDistance.filter((it) => it._distanceKm <= maxKm) : withDistance;

    filteredByWithin.sort((a, b) => {
      if (Number.isFinite(maxKm)) return a._distanceKm - b._distanceKm;
      return (a.name || '').localeCompare(b.name || '');
    });
    return filteredByWithin;
  }, [filteredItems, withinKm]);

  const handleOpenRequest = (item) => {
    setRequestItem(item);
    setShowRequestModal(true);
  };

  const handleCloseRequest = () => {
    setShowRequestModal(false);
    setRequestItem(null);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    const form = e.target;
    const startDateVal = form.startDate.value;
    const endDateVal = form.endDate.value;
    const fullName = form.fullName.value.trim();
    const phone = form.phone.value.trim();
    const notes = form.notes.value.trim();

    if (!fullName || !phone || !startDateVal || !endDateVal) return;

    if (!requestItem || requestItem.id == null) {
      if (typeof showToast === 'function') {
        showToast({
          message: t(
            'equipment.requestError',
            'Cannot send request for this equipment. Please try again later.',
          ),
          type: 'error',
        });
      }
      return;
    }

    const payload = {
      startDate: startDateVal,
      endDate: endDateVal,
      fullName,
      phone,
      notes: [operation ? `Operation: ${operation}` : '', notes].filter(Boolean).join(' | '),
    };

    try {
      if (typeof onRequestEquipment === 'function') {
        await onRequestEquipment(requestItem.id, payload);
      }

      // Store locally so “My Bookings” works immediately.
      const next = [
        {
          id: `bk_${Date.now()}`,
          status: 'requested',
          createdAt: new Date().toISOString(),
          equipmentId: requestItem.id,
          equipmentName: requestItem.name,
          location: requestItem.location || '',
          mode: (requestItem.modeKey || requestItem.mode || '').toString(),
          startDate: startDateVal,
          endDate: endDateVal,
          fullName,
          phone,
          notes: payload.notes,
        },
        ...readLocalBookings(),
      ];
      writeLocalBookings(next);
      setBookings(next);
      lastBookingPhoneRef.current = phone;

      if (typeof showToast === 'function') {
        showToast({
          message: t(
            'equipment.requestSubmitted',
            'Your request has been sent to the owner. They will contact you soon.',
          ),
          type: 'success',
        });
      }

      form.reset();
      handleCloseRequest();
    } catch (err) {
      if (typeof showToast === 'function') {
        showToast({
          message: t(
            'equipment.requestError',
            'Could not send your request. Please try again.',
          ),
          type: 'error',
        });
      }
    }
  };

  const refreshBookingsFromServer = async () => {
    const phone = lastBookingPhoneRef.current || '';
    if (!phone) return;
    setBookingsLoading(true);
    try {
      const serverBookings = await api.getEquipmentRequests({ phone });
      if (Array.isArray(serverBookings) && serverBookings.length) {
        // Merge server bookings into local list (best-effort).
        const existing = readLocalBookings();
        const merged = [...existing];
        serverBookings.forEach((sb) => {
          const exists = merged.some((b) => b.createdAt === sb.createdAt && b.phone === sb.phone && b.equipmentId === sb.equipmentId);
          if (!exists) {
            merged.push({
              id: `srv_${sb.id}`,
              status: 'requested',
              createdAt: sb.createdAt,
              equipmentId: sb.equipmentId,
              equipmentName:
                normalizedItems.find((it) => it.id === sb.equipmentId)?.name || `Equipment #${sb.equipmentId}`,
              location: normalizedItems.find((it) => it.id === sb.equipmentId)?.location || '',
              mode: normalizedItems.find((it) => it.id === sb.equipmentId)?.mode || '',
              startDate: sb.startDate,
              endDate: sb.endDate,
              fullName: sb.fullName,
              phone: sb.phone,
              notes: sb.notes || '',
            });
          }
        });
        merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        writeLocalBookings(merged);
        setBookings(merged);
      }
    } catch {
      // ignore
    } finally {
      setBookingsLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="section">
        <header className="section-header">
          <div className="section-header-main">
            <h2>{t('equipment.title')}</h2>
            <p>{t('equipment.description')}</p>
          </div>
        </header>
        <div className="grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card skeleton skeleton-card">
              <div className="skeleton skeleton-line" style={{ width: '75%' }} />
              <div className="skeleton skeleton-line short" />
              <div className="skeleton skeleton-line" style={{ width: '50%', marginTop: '0.5rem' }} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  const requestMode =
    ((requestItem && (requestItem.modeKey || requestItem.mode || '')) || '')
      .toString()
      .toLowerCase();

  return (
    <section className="section">
      <header className="section-header">
        <div className="section-header-main">
          <h2>{t('equipment.title')}</h2>
          <p>{t('equipment.description')}</p>
        </div>
        {onAddEquipment && (
          <div className="section-header-actions">
            <button
              type="button"
              className="primary-btn"
              onClick={() => setShowAddForm((v) => !v)}
              aria-expanded={showAddForm}
            >
              {t('equipment.listEquipment')}
            </button>
          </div>
        )}
      </header>

      <div className="equipment-tabs" role="tablist" aria-label={t('equipment.tabs', 'Equipment tabs')}>
        <button
          type="button"
          className={`equipment-tab ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
          role="tab"
          aria-selected={activeTab === 'search'}
        >
          {t('equipment.searchTab', 'Search Equipment')}
        </button>
        <button
          type="button"
          className={`equipment-tab ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
          role="tab"
          aria-selected={activeTab === 'bookings'}
        >
          {t('equipment.bookingsTab', 'My Bookings')}
        </button>
      </div>

      {showAddForm && onAddEquipment && (
        <Modal
          title={t('equipment.listEquipment')}
          onClose={() => setShowAddForm(false)}
        >
          <form onSubmit={handleSubmitEquipment} className="form">
            <label className="form-label">
              {t('equipment.itemName')}
              <input
                type="text"
                name="itemName"
                required
                placeholder={t('equipment.itemName')}
                className="form-input"
              />
            </label>
            <label className="form-label">
              {t('equipment.modeLabel')}
              <select name="mode" required className="form-input">
                <option value="Rent">Rent</option>
                <option value="Sell">Sell</option>
              </select>
            </label>
            <label className="form-label">
              {t('equipment.priceLabel')}
              <input
                type="text"
                name="price"
                required
                placeholder="₹1,500 / day"
                className="form-input"
              />
            </label>
            <label className="form-label">
              {t('equipment.locationLabel')}
              <input
                type="text"
                name="location"
                placeholder={t('equipment.locationLabel')}
                className="form-input"
              />
            </label>
            <label className="form-label checkbox-label">
              <input type="checkbox" name="includesOperator" />
              {t('equipment.operatorLabel')}
            </label>
            <label className="form-label checkbox-label">
              <input type="checkbox" name="isNegotiable" />
              {t('equipment.negotiableLabel', 'Price negotiable')}
            </label>
            <div className="card-footer-row mt">
              <button type="submit" className="primary-btn">{t('equipment.submitEquipment')}</button>
              <button type="button" className="ghost-btn" onClick={() => setShowAddForm(false)}>
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {!loading && !hasItems && (
        <div className="empty-state card">
          <div className="empty-state-icon" aria-hidden>🚜</div>
          <h3>{t('equipment.title')}</h3>
          <p>No equipment listed yet. List your first item for rent or sale.</p>
          {onAddEquipment && (
            <button type="button" className="primary-btn mt-lg" onClick={() => setShowAddForm(true)}>
              {t('equipment.listEquipment')}
            </button>
          )}
        </div>
      )}

      {activeTab === 'bookings' && (
        <>
          <div className="equipment-bookings-summary">
            {(() => {
              const total = bookings.length;
              const requested = bookings.filter((b) => b.status === 'requested').length;
              const confirmed = bookings.filter((b) => b.status === 'confirmed').length;
              const rejected = bookings.filter((b) => b.status === 'rejected').length;
              const inProgress = bookings.filter((b) => b.status === 'in_progress').length;
              const completed = bookings.filter((b) => b.status === 'completed').length;
              return (
                <div className="equipment-bookings-cards">
                  <div className="equipment-bookings-card">
                    <div className="equipment-bookings-card-title">{t('equipment.totalRequests', 'Total Requests')}</div>
                    <div className="equipment-bookings-card-value">{total}</div>
                  </div>
                  <div className="equipment-bookings-card">
                    <div className="equipment-bookings-card-title">{t('equipment.bookingRequested', 'Booking Requested')}</div>
                    <div className="equipment-bookings-card-value">{requested}</div>
                  </div>
                  <div className="equipment-bookings-card">
                    <div className="equipment-bookings-card-title">{t('equipment.confirmed', 'Confirmed')}</div>
                    <div className="equipment-bookings-card-value">{confirmed}</div>
                  </div>
                  <div className="equipment-bookings-card">
                    <div className="equipment-bookings-card-title">{t('equipment.rejected', 'Rejected')}</div>
                    <div className="equipment-bookings-card-value">{rejected}</div>
                  </div>
                  <div className="equipment-bookings-card">
                    <div className="equipment-bookings-card-title">{t('equipment.workInProgress', 'Work In Progress')}</div>
                    <div className="equipment-bookings-card-value">{inProgress}</div>
                  </div>
                  <div className="equipment-bookings-card">
                    <div className="equipment-bookings-card-title">{t('equipment.completed', 'Completed')}</div>
                    <div className="equipment-bookings-card-value">{completed}</div>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="equipment-bookings-actions">
            <button
              type="button"
              className="small-btn"
              disabled={bookingsLoading}
              onClick={refreshBookingsFromServer}
              title={t('equipment.refreshBookingsHint', 'Refresh using the phone number from your last booking request')}
            >
              {bookingsLoading ? t('common.loading', 'Loading…') : t('equipment.refresh', 'Refresh')}
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => {
                writeLocalBookings([]);
                setBookings([]);
              }}
            >
              {t('equipment.clearBookings', 'Clear')}
            </button>
          </div>

          {bookings.length === 0 ? (
            <div className="empty-state card">
              <div className="empty-state-icon" aria-hidden>📭</div>
              <h3>{t('equipment.noBookings', 'No bookings available')}</h3>
              <p>{t('equipment.noBookingsDesc', 'Make a booking request from “Search Equipment” to see it here.')}</p>
              <button type="button" className="primary-btn mt-lg" onClick={() => setActiveTab('search')}>
                {t('equipment.searchTab', 'Search Equipment')}
              </button>
            </div>
          ) : (
            <div className="equipment-bookings-list">
              {bookings.map((b) => (
                <div key={b.id} className="card equipment-booking-row">
                  <div className="equipment-booking-row-main">
                    <div className="equipment-booking-title">{b.equipmentName}</div>
                    <div className="muted small">
                      {b.location ? `${b.location} • ` : ''}
                      {b.startDate} → {b.endDate}
                    </div>
                    {b.notes && <div className="muted small">{b.notes}</div>}
                  </div>
                  <div className="equipment-booking-row-right">
                    <span className="pill equipment-booking-status">{(b.status || 'requested').replace(/_/g, ' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'search' && hasItems && (
        <>
          <div className="card equipment-search-card">
            <div className="equipment-search-grid">
              <label className="form-label">
                {t('equipment.district', 'District')}
                <select
                  className="form-input"
                  value={district}
                  onChange={(e) => {
                    setDistrict(e.target.value);
                    setMandal('');
                    setVillage('');
                  }}
                >
                  <option value="">{t('common.select', 'Select')}</option>
                  {districtOptions.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </label>

              <label className="form-label">
                {t('equipment.mandal', 'Mandal')}
                <select
                  className="form-input"
                  value={mandal}
                  onChange={(e) => {
                    setMandal(e.target.value);
                    setVillage('');
                  }}
                >
                  <option value="">{t('common.select', 'Select')}</option>
                  {mandalOptions.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </label>

              <label className="form-label">
                {t('equipment.village', 'Village')}
                <select
                  className="form-input"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                >
                  <option value="">{t('common.select', 'Select')}</option>
                  {villageOptions.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </label>

              <label className="form-label">
                {t('equipment.within', 'Within')}
                <select className="form-input" value={withinKm} onChange={(e) => setWithinKm(e.target.value)}>
                  <option value="">{t('common.select', 'Select')}</option>
                  {[2, 5, 10, 15, 25].map((n) => (
                    <option key={n} value={String(n)}>{n} Km</option>
                  ))}
                </select>
              </label>

              <label className="form-label">
                {t('equipment.equipment', 'Equipment')}
                <select className="form-input" value={equipmentType} onChange={(e) => setEquipmentType(e.target.value)}>
                  <option value="">{t('common.select', 'Select')}</option>
                  {equipmentTypeOptions.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>

              <label className="form-label">
                {t('equipment.operation', 'Operation')}
                <select className="form-input" value={operation} onChange={(e) => setOperation(e.target.value)}>
                  <option value="">{t('common.select', 'Select')}</option>
                  {operationOptions.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </label>

              <label className="form-label">
                {t('equipment.startDate', 'Start Date')}
                <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </label>

              <label className="form-label">
                {t('equipment.endDate', 'End Date')}
                <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </label>

              <label className="form-label">
                {t('equipment.search', 'Search')}
                <input
                  type="search"
                  className="form-input"
                  placeholder={t('equipment.searchPlaceholder', 'Search equipment by name or location')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </label>

              <label className="form-label">
                {t('equipment.modeLabel', 'Mode')}
                <select className="form-input" value={modeFilter} onChange={(e) => setModeFilter(e.target.value)}>
                  <option value="all">{t('equipment.filterModeAll', 'All modes')}</option>
                  <option value="rent">{t('equipment.filterModeRent', 'Rent only')}</option>
                  <option value="sell">{t('equipment.filterModeSell', 'Sell only')}</option>
                </select>
              </label>
            </div>

            <div className="equipment-search-actions">
              <button
                type="button"
                className="ghost-btn"
                onClick={() => {
                  setDistrict('');
                  setMandal('');
                  setVillage('');
                  setWithinKm('');
                  setEquipmentType('');
                  setOperation('');
                  setStartDate('');
                  setEndDate('');
                  setSearchTerm('');
                  setModeFilter('all');
                }}
              >
                {t('equipment.reset', 'Reset')}
              </button>
              <button type="button" className="primary-btn" onClick={() => {}}>
                {t('equipment.submit', 'Submit')}
              </button>
            </div>
          </div>

          {decoratedResults.length === 0 ? (
            <div className="empty-state card">
              <div className="empty-state-icon" aria-hidden>🔍</div>
              <h3>
                {t('equipment.noMatchesTitle', 'No equipment matches your filters')}
              </h3>
              <p>
                {t(
                  'equipment.noMatchesDescription',
                  'Try changing or clearing your filters to see more equipment.',
                )}
              </p>
              <button
                type="button"
                className="small-btn mt-lg"
                onClick={() => {
                  setDistrict('');
                  setMandal('');
                  setVillage('');
                  setWithinKm('');
                  setEquipmentType('');
                  setOperation('');
                  setStartDate('');
                  setEndDate('');
                  setSearchTerm('');
                  setModeFilter('all');
                }}
              >
                {t('equipment.clearFilters', 'Clear filters')}
              </button>
            </div>
          ) : (
            <div className="equipment-results-list">
              {decoratedResults.map((item) => {
                const key = item.id || item.name;
                const statusRaw = (item.status || 'available').toString().toLowerCase();
                let statusLabel;
                if (statusRaw === 'maintenance' || statusRaw === 'under_maintenance') {
                  statusLabel = t('equipment.statusMaintenance', 'Under maintenance');
                } else if (statusRaw === 'in_use' || statusRaw === 'in use') {
                  statusLabel = t('equipment.statusInUse', 'In use');
                } else {
                  statusLabel = t('equipment.statusAvailable', 'Available');
                }
                const modeLabel = (item.modeKey || item.mode || '').toString();
                const mode = modeLabel.toLowerCase();
                const providerName =
                  (item.providerName || item.ownerName || item.farmerName || '').toString().trim();
                const phone = (item.phone || item.mobile || '').toString().trim();
                const ops = Array.isArray(item.operations)
                  ? item.operations
                  : typeof item.operations === 'string'
                    ? item.operations.split(',').map((s) => s.trim()).filter(Boolean)
                    : [];

                return (
                  <article key={key} className="card equipment-result-card">
                    <div className="equipment-result-media" aria-hidden>
                      {item.imageUrl ? (
                        <img className="equipment-result-img" src={item.imageUrl} alt="" />
                      ) : (
                        <div className="equipment-result-media-img" />
                      )}
                    </div>
                    <div className="equipment-result-body">
                      <div className="equipment-result-top">
                        <div className="equipment-result-title">{item.name}</div>
                        <span className={`pill equipment-status-pill equipment-status-${statusRaw.replace(/\s+/g, '_')}`}>
                          {statusLabel}
                        </span>
                      </div>
                      {(providerName || phone) && (
                        <div className="equipment-result-provider">
                          {providerName && <div className="equipment-provider-name">{providerName}</div>}
                          {phone && (
                            <a className="equipment-provider-phone" href={`tel:${phone}`}>
                              {phone}
                            </a>
                          )}
                        </div>
                      )}
                      <div className="equipment-result-sub muted">
                        {item.location || t('equipment.locationUnknown', 'Location not set')}
                      </div>
                      {ops.length > 0 && (
                        <div className="equipment-result-ops muted small">
                          <span className="equipment-ops-label">{t('equipment.operations', 'Operations')}</span>{' '}
                          {ops.join(', ')}
                        </div>
                      )}
                      <div className="equipment-result-row">
                        <div className="equipment-result-pill">
                          <span className={`pill equipment-mode-pill equipment-mode-${mode || 'rent'}`}>
                            {mode === 'sell' ? t('equipment.modeSellShort', 'Sell') : t('equipment.modeRentShort', 'Rent')}
                          </span>
                        </div>
                        <div className="equipment-result-meta muted small">
                          {t('equipment.distance', '{{km}} Km', { km: item._distanceKm })}
                          {' • '}
                          <span className="equipment-stars" aria-label={t('equipment.rating', 'Rating {{rating}}', { rating: item._rating })}>
                            {'★★★★★'.slice(0, Math.round(item._rating))}{'☆☆☆☆☆'.slice(0, 5 - Math.round(item._rating))}
                          </span>
                        </div>
                      </div>
                      <div className="equipment-result-price">{item.price}</div>
                      <div className="equipment-result-foot">
                        <div className="equipment-result-operator muted small">
                          {item.includesOperator ? t('equipment.includesOperator') : t('equipment.operatorNotIncluded')}
                        </div>
                        <button type="button" className="primary-btn equipment-book-btn" onClick={() => handleOpenRequest(item)}>
                          {t('equipment.bookNow', 'Book Now')}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {showRequestModal && requestItem && (
        <Modal
          title={
            requestMode === 'rent'
              ? t('equipment.requestModalTitleRent', 'Request to rent this equipment')
              : t('equipment.requestModalTitleSell', 'Request to buy this equipment')
          }
          onClose={handleCloseRequest}
        >
          <div className="equipment-request-summary">
            <p className="muted">
              <strong>{requestItem.name}</strong>
              {requestItem.price ? ` — ${requestItem.price}` : ''}
            </p>
            <p className="equipment-request-pill-row">
              <span
                className={`pill equipment-mode-pill equipment-mode-${requestMode || 'rent'}`}
              >
                {requestMode === 'sell'
                  ? t('equipment.modeSellShort', 'Buy')
                  : t('equipment.modeRentShort', 'Rent')}
              </span>
              {requestItem.location && (
                <span className="muted equipment-request-location">
                  {requestItem.location}
                </span>
              )}
            </p>
          </div>
          <form className="form" onSubmit={handleSubmitRequest}>
            <label className="form-label">
              {t('equipment.requestDates', 'When do you need it?')}
              <div className="equipment-request-dates">
                <input
                  type="date"
                  name="startDate"
                  required
                  className="form-input"
                />
                <input
                  type="date"
                  name="endDate"
                  required
                  className="form-input"
                />
              </div>
            </label>
            <label className="form-label">
              {t('equipment.requestFullName', 'Your name')}
              <input
                type="text"
                name="fullName"
                required
                className="form-input"
              />
            </label>
            <label className="form-label">
              {t('equipment.requestPhone', 'Phone / WhatsApp')}
              <input
                type="tel"
                name="phone"
                required
                className="form-input"
              />
            </label>
            <label className="form-label">
              {t('equipment.requestNotes', 'Notes for owner (optional)')}
              <textarea
                name="notes"
                rows="3"
                className="form-input"
              />
            </label>
            <div className="card-footer-row mt">
              <button type="submit" className="primary-btn">
                {t('equipment.submitRequest', 'Send request')}
              </button>
              <button type="button" className="ghost-btn" onClick={handleCloseRequest}>
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}

export default Equipment;
